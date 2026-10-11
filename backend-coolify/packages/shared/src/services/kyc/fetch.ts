import { IKycTiers, KycRequestModel, KycTierType } from "@repo/database";
import mongoose from "mongoose";
import { KycSubdocumentType } from "../../types/general";

/**
 * Tier-1 identity approved, active, and includes at least one selfie.
 */
export const getActiveKycWithSelfie = async (
  userObjectId: mongoose.Types.ObjectId,
) => {
  const userKyc = await KycRequestModel.findOne({
    userId: userObjectId,
  }).lean();
  const identity = userKyc?.requestTiers?.identity?.find(
    (req) =>
      req.reviewStatus === "APPROVED" &&
      req.isActive &&
      Array.isArray(req.selfies) &&
      req.selfies.length > 0,
  );
  return identity ?? null;
};

/**
 * Calculates current tier based on approved items inside request tiers.
 */
export const calculateCurrentTier = (requestTiers?: IKycTiers): KycTierType => {
  if (!requestTiers) return "NONE";

  const isApproved = (list?: KycSubdocumentType[]) =>
    Boolean(
      list?.some(
        (item) => item.reviewStatus === "APPROVED" && Boolean(item.isActive),
      ),
    );

  const hasTier1 = isApproved(requestTiers.identity);
  const hasTier2 = isApproved(requestTiers.address);
  const hasTier3 = isApproved(requestTiers.finance);
  const hasTier4 = isApproved(requestTiers.business);

  if (hasTier1 && hasTier2 && hasTier3 && hasTier4) return "TIER_4";
  if (hasTier1 && hasTier2 && hasTier3) return "TIER_3";
  if (hasTier1 && hasTier2) return "TIER_2";
  if (hasTier1) return "TIER_1";

  return "NONE";
};
