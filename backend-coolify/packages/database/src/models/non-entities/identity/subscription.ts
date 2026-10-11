import { Schema, model, Model } from "mongoose";
import { ISubscriptionDocument } from "../../../types/others";

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["FREE", "PREMIUM", "ENTERPRISE"],
      default: "FREE",
    },
    status: {
      type: String,
      enum: [
        "INCOMPLETE",
        "INCOMPLETE_EXPIRED",
        "TRIALING",
        "ACTIVE",
        "PAST_DUE",
        "CANCELED",
        "UNPAID",
      ],
      default: "ACTIVE",
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index to look up active user entitlements
SubscriptionSchema.index({ userId: 1, status: 1 });

export const SubscriptionModel: Model<ISubscriptionDocument> =
  model<ISubscriptionDocument>(
    "Subscription",
    SubscriptionSchema,
    "subscriptions",
  );
