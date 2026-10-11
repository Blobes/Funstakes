import cron from "node-cron";
import mongoose from "mongoose";
import {
  UserModel,
  KycRequestModel,
  ModerationStrikeModel,
  USER_NESTED_FIELDS,
} from "@repo/database";
import { calculateCurrentTier } from "@repo/shared";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BATCH_SIZE = 50;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const MIN_FOLLOWERS_GRANT = 500;
const MIN_FOLLOWERS_KEEP = 450;
const MAX_BREACH = 0;

// In-process locks (prevent overlapping cron runs)
let eligibilityRunning = false;

// ---------------------------------------------------------------------------
// Eligibility worker
// ---------------------------------------------------------------------------
export const startEligibilityWorker = () => {
  cron.schedule("0 2 * * *", async () => {
    if (eligibilityRunning) {
      console.warn("[Eligibility] skipped — previous run still active");
      return;
    }
    eligibilityRunning = true;
    console.log("[Eligibility] starting");

    try {
      const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);
      const activeStrikeAccountIds = await ModerationStrikeModel.distinct(
        "account",
        { isActive: true },
      );

      // 1) KYC → user.kyc + legalName (bulk-ish cursor)
      let lastId: mongoose.Types.ObjectId | null = null;
      let kycSynced = 0;

      for (;;) {
        const query: Record<string, unknown> = {};
        if (lastId) query._id = { $gt: lastId };

        const batch = await KycRequestModel.find(query)
          .sort({ _id: 1 })
          .limit(BATCH_SIZE)
          .select({ userId: 1, requestTiers: 1, currentTier: 1 })
          .lean();

        if (!batch.length) break;

        const ops = batch.map((kyc) => {
          const tier = calculateCurrentTier(kyc.requestTiers as any);
          const identity = kyc.requestTiers?.identity?.find(
            (r: any) => r.reviewStatus === "APPROVED" && r.isActive,
          );
          const legalName = identity
            ? [
                identity.legalFirstName,
                identity.legalMiddleName,
                identity.legalLastName,
              ]
                .filter(Boolean)
                .join(" ")
                .trim()
            : null;

          const $set: Record<string, unknown> = {
            [USER_NESTED_FIELDS.KYC_ID]: kyc._id,
            [USER_NESTED_FIELDS.KYC_CURRENT_TIER]: tier,
          };
          if (legalName) $set.legalName = legalName;

          return {
            updateOne: {
              filter: { _id: kyc.userId },
              update: { $set },
            },
          };
        });

        if (ops.length) {
          await UserModel.bulkWrite(ops, { ordered: false });
          kycSynced += ops.length;
        }

        lastId = batch[batch.length - 1]._id as mongoose.Types.ObjectId;
      }

      // 2) Grant badge eligibility
      const granted = await UserModel.updateMany(
        {
          [USER_NESTED_FIELDS.VERIFIED_BADGE_IS_ELIGIBLE]: { $ne: true },
          accountStatus: "ACTIVE",
          policyBreachCount: { $lte: MAX_BREACH },
          createdAt: { $lte: ninetyDaysAgo },
          followersCount: { $gte: MIN_FOLLOWERS_GRANT },
          _id: { $nin: activeStrikeAccountIds },
          $or: [{ isEmailVerified: true }, { isPhoneVerified: true }],
          [USER_NESTED_FIELDS.KYC_CURRENT_TIER]: {
            $in: ["TIER_1", "TIER_2", "TIER_3", "TIER_4"],
          },
        },
        { $set: { [USER_NESTED_FIELDS.VERIFIED_BADGE_IS_ELIGIBLE]: true } },
      );

      // 3) Revoke badge eligibility
      const revoked = await UserModel.updateMany(
        {
          [USER_NESTED_FIELDS.VERIFIED_BADGE_IS_ELIGIBLE]: true,
          $or: [
            { policyBreachCount: { $gt: MAX_BREACH } },
            { _id: { $in: activeStrikeAccountIds } },
            { followersCount: { $lt: MIN_FOLLOWERS_KEEP } },
            { accountStatus: { $ne: "ACTIVE" } },
            { isEmailVerified: false, isPhoneVerified: false },
            { [USER_NESTED_FIELDS.KYC_CURRENT_TIER]: { $in: ["NONE", null] } },
          ],
        },
        { $set: { [USER_NESTED_FIELDS.VERIFIED_BADGE_IS_ELIGIBLE]: false } },
      );

      console.log(
        `[Eligibility] kycSynced=${kycSynced} granted=${granted.modifiedCount} revoked=${revoked.modifiedCount}`,
      );
    } catch (error) {
      console.error("[Eligibility] critical", error);
    } finally {
      eligibilityRunning = false;
    }
  });
};
