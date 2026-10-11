import mongoose from "mongoose";
import { PublicFigureModel, PublicFigureRequestModel } from "@repo/database";
import { TransInfo, MESSAGES_REGISTRY, fetchSingleUser } from "@repo/shared";
import type { ReviewStatus } from "@repo/database";

export interface IReviewPublicFigureInput {
  requestId: string;
  adminId: string;
  decision: ReviewStatus;
  rejectionReason?: string | null;
}

export type ReviewPublicFigureStatus =
  | "SUCCESS"
  | "INVALID_PAYLOAD"
  | "NOT_FOUND"
  | "ALREADY_PROCESSED"
  | "REJECTION_REASON_REQUIRED";

export interface IReviewPublicFigureResult {
  status: ReviewPublicFigureStatus;
  transInfo: TransInfo;
  payload?: {
    requestId: mongoose.Types.ObjectId;
    publicFigureId?: mongoose.Types.ObjectId;
    userId?: string;
    reviewStatus: ReviewStatus;
  };
}

/**
 * Checks if a public figure claim request has already been reviewed.
 */
const isRequestAlreadyReviewed = (reviewStatus?: string): boolean => {
  return reviewStatus === "APPROVED" || reviewStatus === "DENIED";
};

/**
 * Executes administrative review on a public figure claim request.
 */
export const executePublicFigureReview = async (
  input: IReviewPublicFigureInput,
): Promise<IReviewPublicFigureResult> => {
  const { requestId, adminId, decision, rejectionReason } = input;

  if (
    !mongoose.Types.ObjectId.isValid(requestId) ||
    !mongoose.Types.ObjectId.isValid(adminId) ||
    !["APPROVED", "DENIED"].includes(decision)
  ) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  if (decision === "DENIED" && (!rejectionReason || !rejectionReason.trim())) {
    return {
      status: "REJECTION_REASON_REQUIRED",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.REJECTION_REASON_REQUIRED,
    };
  }

  const requestDoc = await PublicFigureRequestModel.findById(requestId);

  if (!requestDoc) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_REQUEST_NOT_FOUND,
    };
  }

  if (isRequestAlreadyReviewed(requestDoc.reviewStatus)) {
    return {
      status: "ALREADY_PROCESSED",
      transInfo:
        MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_REQUEST_ALREADY_REVIEWED,
    };
  }

  const adminObjectId = new mongoose.Types.ObjectId(adminId);
  const now = new Date();

  requestDoc.reviewStatus = decision;
  requestDoc.reviewedBy = adminObjectId;
  requestDoc.reviewedAt = now;
  requestDoc.rejectionReason =
    decision === "DENIED" ? rejectionReason?.trim() : null;

  await requestDoc.save();

  let activePublicFigureId: mongoose.Types.ObjectId | undefined;

  if (decision === "APPROVED") {
    const publicFigureProfile = await PublicFigureModel.findOneAndUpdate(
      { userId: requestDoc.userId },
      {
        $set: {
          userId: requestDoc.userId,
          requestId: requestDoc._id,
          publicName: requestDoc.publicName,
          legalName: requestDoc.legalName,
          publicEmail: requestDoc.publicEmail,
          accountEmail: requestDoc.accountEmail,
          status: "ACTIVE",
          category: requestDoc.category,
          notabilityScore: requestDoc.notabilityScore,
          networth: requestDoc.networth,
          description: requestDoc.description,
          milestone: requestDoc.milestone,
          notableWorks: requestDoc.notableWorks,
          officialWebsite: requestDoc.officialWebsite,
          socialLinks: requestDoc.socialLinks,
          signals: requestDoc.signals,
          revokedAt: null,
          revokedBy: null,
          revocationReason: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    activePublicFigureId = publicFigureProfile._id as mongoose.Types.ObjectId;
  }

  const user = await fetchSingleUser({
    identifier: requestDoc.userId,
    flags: { lean: false, skipFilter: true },
  });

  if (user) {
    if (!user.publicFigureInfo) {
      user.publicFigureInfo = {};
    }

    if (decision === "APPROVED" && activePublicFigureId) {
      user.publicFigureInfo.publicFigureId = activePublicFigureId;
    }

    await user.save();
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_REVIEW_PROCESSED,
    payload: {
      requestId: requestDoc._id as mongoose.Types.ObjectId,
      publicFigureId: activePublicFigureId,
      userId: requestDoc.userId?.toString(),
      reviewStatus: decision,
    },
  };
};
