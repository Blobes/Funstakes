import { model, Schema } from "mongoose";
import { IVerifiedBadgeDocument } from "../../types/others";

/**
 * Schema definition for user subscription verification badges.
 */
const VerifiedBadgeSchema = new Schema<IVerifiedBadgeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    subscriptionTier: {
      type: String,
      enum: ["FREE", "PREMIUM", "ENTERPRISE"],
      required: true,
      default: "FREE",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

// Compound index for active subscription lookups and TTL checks
VerifiedBadgeSchema.index({ userId: 1, status: 1 });
VerifiedBadgeSchema.index({ expiresAt: 1 }, { sparse: true });

export const VerifiedBadgeModel = model<IVerifiedBadgeDocument>(
  "VerifiedBadge",
  VerifiedBadgeSchema,
  "verified_badges",
);
