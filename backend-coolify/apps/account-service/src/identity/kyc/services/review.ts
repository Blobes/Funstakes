import mongoose from "mongoose";
import {
  KycRequestModel,
  KycRequestType,
  KycTierType,
  IKycRequestDocument,
  KYC_REQUEST_TIERS,
  KycReviewStatus,
} from "@repo/database";
import {
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  KycSubdocumentType,
  calculateCurrentTier,
} from "@repo/shared";

export interface IReviewKycInput {
  requestId: string;
  requestType?: KycRequestType;
  subdocumentId: string;
  decision: KycReviewStatus;
  adminId: string;
  rejectionReason?: string;
}

export interface IReviewKycResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "INVALID_PAYLOAD"
    | "REJECTED_REASON_REQUIRED"
    | "ERROR";
  transInfo: TransInfo;
  payload?: {
    requestId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    requestType?: KycRequestType;
    subdocumentId?: mongoose.Types.ObjectId;
    decision?: KycReviewStatus;
    currentTier?: KycTierType;
  };
}

/**
 * Executes administrative review on a target tier subdocument.
 */
export const executeKycReview = async (
  input: IReviewKycInput,
): Promise<IReviewKycResult> => {
  const {
    requestId,
    requestType: inputRequestType,
    subdocumentId,
    decision,
    adminId,
    rejectionReason,
  } = input;

  if (
    !mongoose.Types.ObjectId.isValid(requestId) ||
    !mongoose.Types.ObjectId.isValid(subdocumentId) ||
    !mongoose.Types.ObjectId.isValid(adminId) ||
    !["APPROVED", "REJECTED"].includes(decision)
  ) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  if (
    decision === "REJECTED" &&
    (!rejectionReason || !rejectionReason.trim())
  ) {
    return {
      status: "REJECTED_REASON_REQUIRED",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.REJECTION_REASON_REQUIRED,
    };
  }

  const kycDocument = (await KycRequestModel.findById(
    requestId,
  )) as IKycRequestDocument | null;

  if (!kycDocument || !kycDocument.requestTiers) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.SUBMISSION_NOT_FOUND,
    };
  }

  const { requestTiers } = kycDocument;
  const {
    identity = [],
    address = [],
    finance = [],
    business = [],
  } = requestTiers;

  const targetObjectId = new mongoose.Types.ObjectId(subdocumentId);

  const tierLists: KycSubdocumentType[][] = [
    identity,
    address,
    finance,
    business,
  ];

  const targetSubdocumentList = tierLists.find((list) =>
    list.some((doc) => doc._id?.equals(targetObjectId)),
  );

  const targetSubdocument = targetSubdocumentList?.find((doc) =>
    doc._id?.equals(targetObjectId),
  );

  if (!targetSubdocument || !targetSubdocumentList) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.SUBDOCUMENT_NOT_FOUND,
    };
  }

  const effectiveRequestType =
    targetSubdocument.requestType || inputRequestType;

  if (!effectiveRequestType || !KYC_REQUEST_TIERS[effectiveRequestType]) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  const isApproved = decision === "APPROVED";

  if (isApproved) {
    targetSubdocumentList.forEach((item) => {
      if (
        item.requestType === effectiveRequestType &&
        item._id?.toString() !== subdocumentId
      ) {
        item.isActive = false;
      }
    });
  }

  targetSubdocument.reviewStatus = decision;
  targetSubdocument.isActive = isApproved;
  targetSubdocument.reviewedBy = new mongoose.Types.ObjectId(adminId);
  targetSubdocument.reviewedAt = new Date();
  targetSubdocument.rejectionReason = isApproved
    ? null
    : rejectionReason?.trim();

  const updatedTier = calculateCurrentTier(requestTiers);
  kycDocument.currentTier = updatedTier;

  await kycDocument.save();

  const user = await fetchSingleUser({
    identifier: kycDocument.userId.toString(),
    flags: { lean: false, skipFilter: true },
  });

  if (user) {
    if (!user.kyc) user.kyc = {};

    if (
      targetSubdocument.legalFirstName ||
      targetSubdocument.legalLastName ||
      targetSubdocument.legalMiddleName
    ) {
      const fullLegalNames =
        `${targetSubdocument.legalFirstName ?? ""} ${targetSubdocument.legalMiddleName ?? ""} ${targetSubdocument.legalLastName ?? ""}`
          .replace(/\s+/g, " ")
          .trim();
      if (fullLegalNames) user.legalName = fullLegalNames;
    }

    user.kyc.kycId = kycDocument._id as mongoose.Types.ObjectId;
    user.kyc.currentTier = updatedTier;

    if (effectiveRequestType === "AGE_CONFIRMATION" && isApproved) {
      user.isAgeVerified = true;
    }

    await user.save();
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.VERIFICATION.SUBMISSION_REVIEWED_SUCCESSFULLY,
    payload: {
      requestId: kycDocument._id,
      userId: kycDocument.userId,
      requestType: effectiveRequestType,
      subdocumentId: targetSubdocument._id,
      decision,
      currentTier: updatedTier,
    },
  };
};
