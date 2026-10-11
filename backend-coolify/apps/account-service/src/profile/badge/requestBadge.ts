import mongoose from "mongoose";
import {
  SubscriptionModel,
  KycRequestModel,
  ModerationCaseModel,
  FollowModel,
  PostViewModel,
  VerifiedBadgeModel,
  PublicFigureModel,
} from "@repo/database";
import { TransInfo, MESSAGES_REGISTRY, fetchSingleUser } from "@repo/shared";

/**
 * Service Configuration Constants for Verification Eligibility
 */
const VERIFICATION_CONFIG = {
  MAX_POLICY_BREACH_COUNT: 0,
  NON_PUBLIC_FIGURE: {
    MIN_ACCOUNT_AGE_DAYS: 30,
    MIN_IMPRESSIONS_90_DAYS: 1000,
    MIN_NEW_FOLLOWERS_90_DAYS: 50,
  },
} as const;

export interface IGetVerifiedBadgeInput {
  userId: string;
}

export type GetVerifiedBadgeStatus =
  | "SUCCESS"
  | "NOT_FOUND"
  | "INVALID_PAYLOAD"
  | "ACCOUNT_INACTIVE"
  | "NOT_PAID_SUBSCRIBER"
  | "KYC_TIER_1_NOT_COMPLETED"
  | "UNRESOLVED_DISPUTE_EXISTS"
  | "POLICY_BREACH_LIMIT_EXCEEDED"
  | "ACCOUNT_TOO_NEW"
  | "INSUFFICIENT_IMPRESSIONS"
  | "INSUFFICIENT_NEW_FOLLOWERS";

export interface IGetVerifiedBadgeResult {
  status: GetVerifiedBadgeStatus;
  transInfo: TransInfo;
  payload?: {
    badgeId?: mongoose.Types.ObjectId;
    issuedAt?: Date;
  };
}

/**
 * Calculates the number of days elapsed between a given date and the current time.
 *
 * @param {Date} date - The starting date to evaluate.
 * @returns {number} The difference in total days.
 */
const getDaysDifference = (date?: Date): number => {
  if (!date) return 0;
  const diffInMs = Date.now() - new Date(date).getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
};

/**
 * Evaluates user account, subscription, KYC, moderation, public figure record, and engagement metrics
 * to verify eligibility and automatically issue a verified badge to qualifying users.
 *
 * @param {IGetVerifiedBadgeInput} input - Parameters containing the target user ID.
 * @returns {Promise<IGetVerifiedBadgeResult>} The status and payload execution result.
 */
export const executeGetVerifiedBadge = async (
  input: IGetVerifiedBadgeInput,
): Promise<IGetVerifiedBadgeResult> => {
  const { userId } = input;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

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

  // Check account status
  if (user.accountStatus !== "ACTIVE") {
    return {
      status: "ACCOUNT_INACTIVE",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.ACCOUNT_NOT_ACTIVE,
    };
  }

  // Check paid subscription
  const activeSubscription = await SubscriptionModel.findOne({
    userId: userObjectId,
    status: "ACTIVE",
    tier: { $in: ["PREMIUM", "ENTERPRISE"] },
  });

  if (!activeSubscription) {
    return {
      status: "NOT_PAID_SUBSCRIBER",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.REQUIRED_PAID_SUBSCRIPTION,
    };
  }

  // Check KYC Tier 1 approval
  const userKyc = await KycRequestModel.findOne({ userId: userObjectId });
  const isTier1Approved = userKyc?.requestTiers?.identity?.some(
    (req) => req.reviewStatus === "APPROVED" && req.isActive,
  );

  if (!isTier1Approved) {
    return {
      status: "KYC_TIER_1_NOT_COMPLETED",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.KYC_TIER_1_REQUIRED,
    };
  }

  // Check unresolved disputes or moderation cases
  const hasUnresolvedDispute = await ModerationCaseModel.exists({
    targetOwner: userObjectId,
    status: { $in: ["OPEN", "UNDER_REVIEW", "ESCALATED", "APPEALED"] },
  });

  if (hasUnresolvedDispute) {
    return {
      status: "UNRESOLVED_DISPUTE_EXISTS",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.UNRESOLVED_DISPUTE_FOUND,
    };
  }

  // Check policy breach limit
  if (
    (user.policyBreachCount ?? 0) > VERIFICATION_CONFIG.MAX_POLICY_BREACH_COUNT
  ) {
    return {
      status: "POLICY_BREACH_LIMIT_EXCEEDED",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.POLICY_BREACH_EXCEEDED,
    };
  }

  // Query PublicFigureModel to check if the user is an active, approved public figure
  const publicFigureRecord = await PublicFigureModel.findOne({
    userId: userObjectId,
    status: "ACTIVE",
    reviewStatus: "APPROVED",
  });

  const isPublicFigure = Boolean(publicFigureRecord);

  if (!isPublicFigure) {
    // Check account age
    const accountAgeDays = getDaysDifference(user.createdAt);
    if (
      accountAgeDays <
      VERIFICATION_CONFIG.NON_PUBLIC_FIGURE.MIN_ACCOUNT_AGE_DAYS
    ) {
      return {
        status: "ACCOUNT_TOO_NEW",
        transInfo: MESSAGES_REGISTRY.VERIFICATION.ACCOUNT_AGE_INSUFFICIENT,
      };
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Check impressions in the last 90 days
    const impressionsCount = await PostViewModel.countDocuments({
      userId: userObjectId,
      viewedAt: { $gte: ninetyDaysAgo },
    });

    if (
      impressionsCount <
      VERIFICATION_CONFIG.NON_PUBLIC_FIGURE.MIN_IMPRESSIONS_90_DAYS
    ) {
      return {
        status: "INSUFFICIENT_IMPRESSIONS",
        transInfo: MESSAGES_REGISTRY.VERIFICATION.IMPRESSIONS_INSUFFICIENT,
      };
    }

    // Check new followers in the last 90 days
    const newFollowersCount = await FollowModel.countDocuments({
      followingId: userObjectId,
      createdAt: { $gte: ninetyDaysAgo },
    });

    if (
      newFollowersCount <
      VERIFICATION_CONFIG.NON_PUBLIC_FIGURE.MIN_NEW_FOLLOWERS_90_DAYS
    ) {
      return {
        status: "INSUFFICIENT_NEW_FOLLOWERS",
        transInfo: MESSAGES_REGISTRY.VERIFICATION.NEW_FOLLOWERS_INSUFFICIENT,
      };
    }
  }

  // Issue or update verified badge record using VerifiedBadgeModel
  let badgeRecord = await VerifiedBadgeModel.findOne({
    userId: userObjectId,
  });

  const currentSubscriptionTier = activeSubscription.tier;

  if (!badgeRecord) {
    badgeRecord = await VerifiedBadgeModel.create({
      userId: userObjectId,
      status: "ACTIVE",
      subscriptionTier: currentSubscriptionTier,
      issuedAt: new Date(),
    });
  } else {
    badgeRecord.status = "ACTIVE";
    badgeRecord.subscriptionTier = currentSubscriptionTier;
    badgeRecord.issuedAt = new Date();
    badgeRecord.revokedAt = null;
    badgeRecord.revokedReason = null;
    await badgeRecord.save();
  }

  user.verifiedBadge = {
    badgeId: badgeRecord._id as mongoose.Types.ObjectId,
    isEligible: true,
  };

  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.VERIFICATION.BADGE_ISSUED_SUCCESS,
    payload: {
      badgeId: badgeRecord._id,
      issuedAt: badgeRecord.issuedAt,
    },
  };
};
