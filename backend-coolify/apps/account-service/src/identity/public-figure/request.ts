import mongoose from "mongoose";
import { PublicFigureModel, PublicFigureRequestModel } from "@repo/database";
import {
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  fetchExternalPublicFigure,
  getActiveKycWithSelfie,
  getEmailDomain,
  hasModerationBlock,
} from "@repo/shared";
import type {
  IPublicFigureBase,
  PublicFigureCategory,
  ReviewStatus,
} from "@repo/database";

export interface IRequestPublicFigureInput {
  userId: string;
  category?: PublicFigureCategory;
}

export type RequestStatus =
  | "SUCCESS"
  | "AUTO_APPROVED"
  | "INVALID_PAYLOAD"
  | "USER_NOT_FOUND"
  | "ACCOUNT_INACTIVE"
  | "KYC_REQUIRED"
  | "NOT_QUALIFIED"
  | "ALREADY_SUBMITTED"
  | "ALREADY_APPROVED"
  | "EMAIL_NOT_VERIFIED"
  | "EXTERNAL_FETCH_FAILED";

export interface ReqChecks {
  meetsNotabilityScore: boolean;
  emailDomainMatch: boolean;
  hasMatchedName: boolean;
}

export interface IRequestPublicFigureResult {
  status: RequestStatus;
  transInfo: TransInfo;
  payload?: {
    requiresKyc?: boolean;
    publicFigureRequestId?: mongoose.Types.ObjectId;
    publicFigureId?: mongoose.Types.ObjectId;
    reviewStatus?: ReviewStatus;
    notabilityScore?: number;
    publicName?: string | null;
    checksPassed?: number;
    checks?: ReqChecks;
  };
}

/**
 * Submits a public-figure claim: external notability + trust checks,
 * then auto-approve, queue review, or hard decline.
 */
export const executePublicFigureRequest = async (
  input: IRequestPublicFigureInput,
): Promise<IRequestPublicFigureResult> => {
  const { userId, category } = input;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
    };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: false },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (user.accountStatus !== "ACTIVE") {
    return {
      status: "ACCOUNT_INACTIVE",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.ACCOUNT_NOT_ACTIVE,
    };
  }

  if (!user.isEmailVerified) {
    return {
      status: "EMAIL_NOT_VERIFIED",
      transInfo: MESSAGES_REGISTRY.PROFILE.EMAIL_NOT_VERIFIED,
    };
  }

  if (await hasModerationBlock(userObjectId, user.policyBreachCount)) {
    return {
      status: "NOT_QUALIFIED", // or new status "MODERATION_BLOCKED"
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_MODERATION_BLOCKED,
    };
  }

  const identityWithSelfie = await getActiveKycWithSelfie(userObjectId);
  if (!identityWithSelfie) {
    return {
      status: "KYC_REQUIRED",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.KYC_TIER_1_REQUIRED,
      payload: { requiresKyc: true },
    };
  }

  // --- Already active recognition ---
  const activeProfile = await PublicFigureModel.findOne({
    userId: userObjectId,
    status: "ACTIVE",
  });
  if (activeProfile) {
    return {
      status: "ALREADY_APPROVED",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_ALREADY_APPROVED,
      payload: {
        publicFigureId: activeProfile._id as mongoose.Types.ObjectId,
        notabilityScore: activeProfile.notabilityScore,
        publicName: activeProfile.publicName,
      },
    };
  }

  // --- Pending admin review ---
  const pendingRequest = await PublicFigureRequestModel.findOne({
    userId: userObjectId,
    reviewStatus: "PENDING",
  });
  if (pendingRequest) {
    return {
      status: "ALREADY_SUBMITTED",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_PENDING_REVIEW,
      payload: {
        publicFigureRequestId: pendingRequest._id as mongoose.Types.ObjectId,
        reviewStatus: "PENDING",
        notabilityScore: pendingRequest.notabilityScore,
        publicName: pendingRequest.publicName,
      },
    };
  }

  // Prefer KYC legal name for external fetch over user.legalName alone
  const kycLegalName = [
    identityWithSelfie.legalFirstName,
    identityWithSelfie.legalMiddleName,
    identityWithSelfie.legalLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const external = await fetchExternalPublicFigure({
    displayName: user.displayName,
    legalName: kycLegalName || user.legalName,
    email: user.email,
  });

  if (external.status === "INVALID_PAYLOAD") {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: external.transInfo,
    };
  }

  if (external.status === "NO_DATA_FOUND" || !external.data) {
    return {
      status: "NOT_QUALIFIED",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_NOT_QUALIFIED,
    };
  }

  const fetchedData = external.data;
  const signals = fetchedData.signals ?? {};
  const notabilityScore = fetchedData.notabilityScore ?? 0;
  const resolvedCategory = category ?? fetchedData.category ?? "ORGANIZATION";
  const socialLinks =
    fetchedData.socialLinks && typeof fetchedData.socialLinks === "object"
      ? fetchedData.socialLinks
      : {};

  // ========== Trust checks (counted) ==========

  const accountDomain = getEmailDomain(user.email);
  const fetchedOfficialEmail = fetchedData.publicEmail;
  const fetchedDomain = getEmailDomain(fetchedOfficialEmail);
  const emailDomainMatch = Boolean(
    accountDomain && fetchedDomain && accountDomain === fetchedDomain,
  );

  const meetsNotabilityScore = fetchedData.notabilityScore >= 60;
  const hasMatchedName = Boolean(fetchedData.legalNameMatched);

  const checks: ReqChecks = {
    meetsNotabilityScore,
    emailDomainMatch,
    hasMatchedName,
  };

  const checksPassed = [
    checks.meetsNotabilityScore,
    checks.emailDomainMatch,
    checks.hasMatchedName,
  ].filter(Boolean).length;

  // Fewer than 2 → decline, do not persist
  if (checksPassed < 2) {
    return {
      status: "NOT_QUALIFIED",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_NOT_QUALIFIED,
      payload: {
        checksPassed,
        checks,
        notabilityScore,
        publicName: fetchedData.publicName ?? null,
      },
    };
  }

  const requestPayload: IPublicFigureBase = {
    publicName: fetchedData.publicName ?? null,
    legalName: fetchedData.legalName,
    publicEmail: fetchedData.publicEmail,
    accountEmail: user.email,
    category: resolvedCategory,
    notabilityScore,
    networth: fetchedData.networth ?? null,
    description: fetchedData.description ?? null,
    milestone: fetchedData.milestone ?? null,
    notableWorks: fetchedData.notableWorks ?? [],
    officialWebsite: fetchedData.officialWebsite ?? null,
    socialLinks,
    signals,
  };

  // All 3 passed → auto-grant recognition
  if (checksPassed === 3) {
    const requestDoc = await PublicFigureRequestModel.create({
      userId: userObjectId,
      ...requestPayload,
      reviewStatus: "APPROVED",
      reviewedAt: new Date(),
    });

    const figureDoc = await PublicFigureModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          userId: userObjectId,
          ...requestPayload,
          requestId: requestDoc._id,
          status: "ACTIVE",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    user.publicFigureInfo = {
      publicFigureId: figureDoc._id,
      isEligible: true,
      signals,
    };
    await user.save();

    return {
      status: "AUTO_APPROVED",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_AUTO_APPROVED,
      payload: {
        publicFigureRequestId: requestDoc._id,
        publicFigureId: figureDoc._id,
        reviewStatus: "APPROVED",
        notabilityScore,
        publicName: figureDoc.publicName,
        checksPassed,
        checks,
      },
    };
  }

  // Exactly 2 passed → pending admin review
  const requestDoc = await PublicFigureRequestModel.create({
    userId: userObjectId,
    ...requestPayload,
    reviewStatus: "PENDING",
  });

  user.publicFigureInfo = {
    publicFigureId: user.publicFigureInfo?.publicFigureId ?? null,
    isEligible: true,
    signals,
  };
  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_SUBMITTED,
    payload: {
      publicFigureRequestId: requestDoc._id as mongoose.Types.ObjectId,
      reviewStatus: "PENDING",
      notabilityScore,
      publicName: requestDoc.publicName,
      checksPassed,
      checks,
    },
  };
};
