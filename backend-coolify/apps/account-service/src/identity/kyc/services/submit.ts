import mongoose from "mongoose";
import {
  IKycAddressRequest,
  IKycBusinessRequest,
  IKycFinanceRequest,
  IKycIdentityRequest,
  KYC_REQUEST_TIERS,
  KycRequestModel,
  KycRequestType,
  KycTierType,
} from "@repo/database";
import { TransInfo, MESSAGES_REGISTRY, fetchSingleUser } from "@repo/shared";

export interface ISubmitKycInput {
  userId: string;
  requestType: KycRequestType;
  additionalLinks?: string[];
  requests?: {
    identity?: IKycIdentityRequest;
    address?: IKycAddressRequest;
    finance?: IKycFinanceRequest;
    business?: IKycBusinessRequest;
  };
}

interface ISubmitKycResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "ALREADY_PENDING"
    | "ALREADY_ACTIVE"
    | "INVALID_PAYLOAD"
    | "MISSING_REQUIRED_TIERS";
  transInfo: TransInfo;
  payload?: {
    requestId: mongoose.Types.ObjectId;
    currentTier: KycTierType;
  };
}

const areValidObjectIds = (ids?: string[]): boolean => {
  if (!ids) return true;
  return ids.every((id) => mongoose.Types.ObjectId.isValid(id));
};

const isRequestArrayPending = (
  requestsArray?: Array<{ reviewStatus?: string | null }>,
): boolean => {
  if (!requestsArray || requestsArray.length === 0) return false;
  const latestRequest = requestsArray[requestsArray.length - 1];
  return (
    latestRequest?.reviewStatus === "PENDING" ||
    latestRequest?.reviewStatus === "UNDER_REVIEW"
  );
};

const hasActiveApprovedSubmission = (
  requestsArray: Array<{
    requestType?: string | null;
    reviewStatus?: string | null;
    isActive?: boolean;
    submittedAt?: Date | null;
  }> = [],
  targetRequestType: KycRequestType,
  monthsThreshold = 6,
): boolean => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsThreshold);
  return requestsArray.some((item) => {
    const isMatchingType = item.requestType === targetRequestType;
    const isApproved = item.reviewStatus === "APPROVED";
    const isActive = Boolean(item.isActive);
    const isWithinThreshold = item.submittedAt
      ? new Date(item.submittedAt) >= cutoffDate
      : false;
    return isMatchingType && isApproved && isActive && isWithinThreshold;
  });
};

/** Which tier keys were actually sent in this submission. */
const submittedTierFromPayload = (
  requests: NonNullable<ISubmitKycInput["requests"]>,
): KycTierType[] => {
  const tiers: KycTierType[] = [];
  if (requests.identity) tiers.push("TIER_1");
  if (requests.address) tiers.push("TIER_2");
  if (requests.finance) tiers.push("TIER_3");
  if (requests.business) tiers.push("TIER_4");
  return tiers;
};

/**
 * Handles multi-tier KYC submissions, including DOCUMENT_UPDATE patches.
 */
export const executeKycSubmission = async (
  input: ISubmitKycInput,
): Promise<ISubmitKycResult> => {
  const { userId, requestType, additionalLinks, requests } = input;
  const isDocumentUpdate = requestType === "DOCUMENT_UPDATE";

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  if (
    !requests ||
    (!requests.identity &&
      !requests.address &&
      !requests.finance &&
      !requests.business)
  ) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  const requiredTiers = KYC_REQUEST_TIERS[requestType] || [];
  const submittedTiers = submittedTierFromPayload(requests);

  // DOCUMENT_UPDATE: any non-empty subset of tiers is allowed.
  // Other request types: every tier listed in KYC_REQUEST_TIERS must be present.
  if (isDocumentUpdate) {
    if (submittedTiers.length === 0) {
      return {
        status: "MISSING_REQUIRED_TIERS",
        transInfo:
          MESSAGES_REGISTRY.VERIFICATION.MISSING_REQUIRED_TIER_PAYLOADS,
      };
    }
  } else {
    const hasRequiredPayloads = requiredTiers.every((tier) => {
      if (tier === "TIER_1") return Boolean(requests.identity);
      if (tier === "TIER_2") return Boolean(requests.address);
      if (tier === "TIER_3") return Boolean(requests.finance);
      if (tier === "TIER_4") return Boolean(requests.business);
      return true;
    });
    if (!hasRequiredPayloads) {
      return {
        status: "MISSING_REQUIRED_TIERS",
        transInfo:
          MESSAGES_REGISTRY.VERIFICATION.MISSING_REQUIRED_TIER_PAYLOADS,
      };
    }
  }

  const isIdentityMediaValid =
    (!requests.identity?.mediaContent ||
      mongoose.Types.ObjectId.isValid(requests.identity.mediaContent)) &&
    areValidObjectIds(requests.identity?.selfies as string[]);
  const isAddressMediaValid =
    !requests.address?.mediaContent ||
    mongoose.Types.ObjectId.isValid(requests.address.mediaContent);
  const isBusinessMediaValid =
    !requests.business?.mediaContent ||
    mongoose.Types.ObjectId.isValid(requests.business.mediaContent);

  if (!isIdentityMediaValid || !isAddressMediaValid || !isBusinessMediaValid) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: false },
  });
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const existingKyc = await KycRequestModel.findOne({ userId: userObjectId });

  // Tiers we must validate for this call:
  // - DOCUMENT_UPDATE → only tiers present in the payload
  // - others → full required set from KYC_REQUEST_TIERS
  const tiersToValidate = isDocumentUpdate ? submittedTiers : requiredTiers;

  if (existingKyc?.requestTiers) {
    // DOCUMENT_UPDATE may replace documents even when an approved active row exists.
    if (!isDocumentUpdate) {
      const isAlreadyActive = tiersToValidate.some((tier) => {
        switch (tier) {
          case "TIER_1":
            return hasActiveApprovedSubmission(
              existingKyc.requestTiers?.identity,
              requestType,
            );
          case "TIER_2":
            return hasActiveApprovedSubmission(
              existingKyc.requestTiers?.address,
              requestType,
            );
          case "TIER_3":
            return hasActiveApprovedSubmission(
              existingKyc.requestTiers?.finance,
              requestType,
            );
          case "TIER_4":
            return hasActiveApprovedSubmission(
              existingKyc.requestTiers?.business,
              requestType,
            );
          default:
            return false;
        }
      });

      if (isAlreadyActive) {
        return {
          status: "ALREADY_ACTIVE",
          transInfo: MESSAGES_REGISTRY.VERIFICATION.REQUEST_ALREADY_ACTIVE,
        };
      }
    }

    const activePending = tiersToValidate.some((tier) => {
      switch (tier) {
        case "TIER_1":
          return isRequestArrayPending(existingKyc.requestTiers?.identity);
        case "TIER_2":
          return isRequestArrayPending(existingKyc.requestTiers?.address);
        case "TIER_3":
          return isRequestArrayPending(existingKyc.requestTiers?.finance);
        case "TIER_4":
          return isRequestArrayPending(existingKyc.requestTiers?.business);
        default:
          return false;
      }
    });

    if (activePending) {
      return {
        status: "ALREADY_PENDING",
        transInfo: MESSAGES_REGISTRY.VERIFICATION.ALREADY_PENDING,
      };
    }
  }

  const mergedLinks = Array.from(
    new Set([
      ...(existingKyc?.additionalLinks || []),
      ...(additionalLinks || []),
    ]),
  );

  let targetKycDocument = existingKyc;
  if (!targetKycDocument) {
    targetKycDocument = new KycRequestModel({
      userId: userObjectId,
      additionalLinks: mergedLinks,
      currentTier: "NONE",
      requestTiers: {
        identity: [],
        address: [],
        business: [],
        finance: [],
      },
    });
  } else {
    targetKycDocument.additionalLinks = mergedLinks;
  }

  targetKycDocument.requestTiers = targetKycDocument.requestTiers || {
    identity: [],
    address: [],
    business: [],
    finance: [],
  };

  if (requests.identity) {
    targetKycDocument.requestTiers.identity =
      targetKycDocument.requestTiers.identity || [];
    targetKycDocument.requestTiers.identity.push({
      legalFirstName: requests.identity.legalFirstName || null,
      legalLastName: requests.identity.legalLastName || null,
      legalMiddleName: requests.identity.legalMiddleName || null,
      requestType,
      mediaContent: requests.identity.mediaContent
        ? new mongoose.Types.ObjectId(requests.identity.mediaContent)
        : null,
      textContent: requests.identity.textContent || null,
      contentType: requests.identity.contentType || null,
      submitMethod: requests.identity.submitMethod || "FILE_UPLOAD",
      selfies:
        requests.identity.selfies?.map(
          (id) => new mongoose.Types.ObjectId(id),
        ) || [],
      reviewStatus: "PENDING",
      isActive: false,
      submittedAt: new Date(),
    });
  }

  if (requests.address) {
    targetKycDocument.requestTiers.address =
      targetKycDocument.requestTiers.address || [];
    targetKycDocument.requestTiers.address.push({
      requestType,
      mediaContent: requests.address.mediaContent
        ? new mongoose.Types.ObjectId(requests.address.mediaContent)
        : null,
      textContent: requests.address.textContent || null,
      contentType: requests.address.contentType || null,
      submitMethod: requests.address.submitMethod || "FILE_UPLOAD",
      reviewStatus: "PENDING",
      isActive: false,
      submittedAt: new Date(),
    });
  }

  if (requests.finance) {
    targetKycDocument.requestTiers.finance =
      targetKycDocument.requestTiers.finance || [];
    targetKycDocument.requestTiers.finance.push({
      requestType,
      bankName: requests.finance.bankName || null,
      accountName: requests.finance.accountName || null,
      accountNumber: requests.finance.accountNumber || null,
      tin: requests.finance.tin || null,
      reviewStatus: "PENDING",
      isActive: false,
      submittedAt: new Date(),
    });
  }

  if (requests.business) {
    targetKycDocument.requestTiers.business =
      targetKycDocument.requestTiers.business || [];
    targetKycDocument.requestTiers.business.push({
      requestType,
      mediaContent: requests.business.mediaContent
        ? new mongoose.Types.ObjectId(requests.business.mediaContent)
        : null,
      textContent: requests.business.textContent || null,
      contentType: requests.business.contentType || null,
      submitMethod: requests.business.submitMethod || "FILE_UPLOAD",
      reviewStatus: "PENDING",
      isActive: false,
      submittedAt: new Date(),
    });
  }

  targetKycDocument.markModified("requestTiers");
  await targetKycDocument.save();

  if (!user.kyc) user.kyc = {};
  user.kyc.kycId = targetKycDocument._id as mongoose.Types.ObjectId;
  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.VERIFICATION.REQUEST_SUBMITTED_SUCCESSFULLY,
    payload: {
      requestId: targetKycDocument._id as mongoose.Types.ObjectId,
      currentTier: targetKycDocument.currentTier,
    },
  };
};
