import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  UserModel,
} from "@repo/database";
import { MESSAGES_REGISTRY, TransInfo } from "@repo/shared";
import mongoose from "mongoose";

export interface ICreateSubscriptionDTO {
  userId: string;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  session?: mongoose.ClientSession;
}

export interface IUpdateSubscriptionDTO {
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string;
  session?: mongoose.ClientSession;
}

export interface IEligibilityResult {
  isEligible: boolean;
  transInfo?: TransInfo;
}

export interface IUpdateSubscriptionResult {
  status: "SUCCESS" | "INELIGIBLE";
  transInfo?: TransInfo;
  subscription?: any;
}

/**
 * Service providing atomic database operations and business logic for subscriptions.
 */
export class SubscriptionService {
  /**
   * Verifies if a user meets requirements to upgrade to elevated subscription tiers.
   */
  public static async verifyUpgradeEligibility(
    userId: string,
    targetTier: SubscriptionTier,
    session?: mongoose.ClientSession,
  ): Promise<IEligibilityResult> {
    if (targetTier === "FREE") return { isEligible: true };

    const user = await UserModel.findById(userId)
      .session(session || null)
      .lean();

    if (!user) {
      return {
        isEligible: false,
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    // Basic requirements for elevated tiers
    const isBasicEligible =
      user.isEmailVerified && user.accountStatus === "ACTIVE";

    if (!isBasicEligible) {
      return {
        isEligible: false,
        transInfo: MESSAGES_REGISTRY.SYSTEM.PREMIUM_SUBSCRIPTION_INELIGIBLE,
      };
    }

    // Additional requirement for Enterprise tier
    if (targetTier === "ENTERPRISE") {
      const isKycTier4 = user.kyc?.currentTier === "TIER_4";

      if (!isKycTier4) {
        return {
          isEligible: false,
          transInfo:
            MESSAGES_REGISTRY.SYSTEM.ENTERPRISE_SUBSCRIPTION_INELIGIBLE,
        };
      }
    }

    return { isEligible: true };
  }

  /**
   * Provisions a new subscription document for a given user.
   */
  public static async createSubscription(data: ICreateSubscriptionDTO) {
    const { session, ...payload } = data;

    const [subscription] = await SubscriptionModel.create(
      [
        {
          userId: payload.userId,
          tier: payload.tier || "FREE",
          status: payload.status || "ACTIVE",
          currentPeriodStart: payload.currentPeriodStart || new Date(),
          currentPeriodEnd: payload.currentPeriodEnd,
          stripeCustomerId: payload.stripeCustomerId,
          stripeSubscriptionId: payload.stripeSubscriptionId,
        },
      ],
      { session },
    );

    return subscription;
  }

  /**
   * Retrieves an active subscription by user ID.
   */
  public static async getByUserId(
    userId: string,
    session?: mongoose.ClientSession,
  ) {
    return SubscriptionModel.findOne({ userId })
      .session(session || null)
      .lean();
  }

  /**
   * Retrieves a subscription by external Stripe customer ID.
   */
  public static async getByStripeCustomerId(
    stripeCustomerId: string,
    session?: mongoose.ClientSession,
  ) {
    return SubscriptionModel.findOne({ stripeCustomerId })
      .session(session || null)
      .lean();
  }

  /**
   * Updates an existing user subscription state with structured eligibility checking.
   */
  public static async updateSubscription(
    userId: string,
    updates: IUpdateSubscriptionDTO,
  ): Promise<IUpdateSubscriptionResult> {
    const { session, tier, ...restUpdates } = updates;

    if (tier) {
      const eligibility = await this.verifyUpgradeEligibility(
        userId,
        tier,
        session,
      );

      if (!eligibility.isEligible) {
        return {
          status: "INELIGIBLE",
          transInfo: eligibility.transInfo,
        };
      }
    }

    const updatedSubscription = await SubscriptionModel.findOneAndUpdate(
      { userId },
      { $set: { ...restUpdates, ...(tier && { tier }) } },
      { new: true, runValidators: true, session },
    ).lean();

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.SYSTEM.SUBSCRIPTION_UPDATED,
      subscription: updatedSubscription,
    };
  }

  /**
   * Flags a user subscription for cancellation at the end of the current billing cycle.
   */
  public static async cancelSubscriptionAtPeriodEnd(
    userId: string,
    session?: mongoose.ClientSession,
  ) {
    return SubscriptionModel.findOneAndUpdate(
      { userId },
      { $set: { cancelAtPeriodEnd: true } },
      { new: true, session },
    ).lean();
  }

  /**
   * Immediately downgrades a user subscription to the FREE tier.
   */
  public static async downgradeToFree(
    userId: string,
    session?: mongoose.ClientSession,
  ) {
    return SubscriptionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          tier: "FREE",
          status: "CANCELED",
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: undefined,
        },
      },
      { new: true, session },
    ).lean();
  }

  /**
   * Synchronizes external provider metadata (e.g., Stripe webhooks).
   */
  public static async syncExternalSubscription(
    stripeCustomerId: string,
    updates: Partial<IUpdateSubscriptionDTO>,
    session?: mongoose.ClientSession,
  ) {
    const { session: _, ...cleanUpdates } = updates;

    return SubscriptionModel.findOneAndUpdate(
      { stripeCustomerId },
      { $set: cleanUpdates },
      { new: true, session },
    ).lean();
  }

  /**
   * Process and downgrade all expired subscriptions.
   */
  public static async processExpiredSubscriptions(
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const now = new Date();
    const result = await SubscriptionModel.updateMany(
      {
        currentPeriodEnd: { $lte: now },
        status: { $in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
        cancelAtPeriodEnd: true,
      },
      {
        $set: {
          tier: "FREE",
          status: "CANCELED",
          cancelAtPeriodEnd: false,
        },
      },
      { session },
    );
    return result.modifiedCount;
  }

  /**
   * Transition subscriptions into PAST_DUE status when past-due period ends.
   */
  public static async processPastDueSubscriptions(
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const now = new Date();
    const result = await SubscriptionModel.updateMany(
      {
        currentPeriodEnd: { $lte: now },
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      },
      {
        $set: {
          status: "PAST_DUE",
        },
      },
      { session },
    );
    return result.modifiedCount;
  }
}
