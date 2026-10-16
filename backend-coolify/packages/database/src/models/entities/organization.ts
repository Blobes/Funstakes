import { Schema, model } from "mongoose";
import { IOrganizationDocument } from "../../types/others";

/**
 * Organization Schema Configuration
 */
const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameCanonical: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    primaryDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    alternateDomains: {
      type: [String],
      default: [],
    },
    logoUrl: { type: String, default: null },
    website: { type: String, default: null },
    country: { type: String, default: null },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_REVIEW", "REJECTED", "DISABLED", "DELETED"],
      default: "PENDING_REVIEW",
    },
    source: {
      type: String,
      enum: ["WIKIDATA", "USER", "ADMIN"],
      default: "USER",
    },
    addedByType: { type: String, default: null },
    claimedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedAt: { type: Date, default: null },
    verification: {
      method: {
        type: String,
        enum: ["ORG_EMAIL_OTP", "DNS_TXT", "ADMIN_VERIFIED", "SYSTEM_VERIFIED"],
        default: null,
      },
      verifiedAt: { type: Date, default: null },
    },
    allowDomainJoin: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// --- Organization Schema Index Configurations ---
// Unique domain constraints
OrganizationSchema.index({ primaryDomain: 1 }, { unique: true });
OrganizationSchema.index({ alternateDomains: 1 }, { sparse: true });

// Search & lookup optimization
OrganizationSchema.index({ nameCanonical: 1 });
OrganizationSchema.index({ status: 1 });
OrganizationSchema.index({ claimedByUserId: 1 }, { sparse: true });

// Composite indexes for domain auto-join & verification workflows
OrganizationSchema.index({ primaryDomain: 1, status: 1, allowDomainJoin: 1 });

/**
 * Organization Model Definition
 */
export const OrganizationModel = model<IOrganizationDocument>(
  "Organization",
  OrganizationSchema,
  "organizations",
);
