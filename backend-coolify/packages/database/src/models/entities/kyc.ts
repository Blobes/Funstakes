import { Schema, model } from "mongoose";
import {
  IKycAddressRequest,
  IKycBusinessRequest,
  IKycFinanceRequest,
  IKycIdentityRequest,
  IKycRequestDocument,
} from "../../types/kyc";
import { KYC_REQUEST_NESTED_FIELDS } from "../../constants/fields";
import { KYC_REQUEST_TYPES, KYC_REVIEW_STATUSES } from "../../constants/others";

/**
 * Identity Request Subdocument Schema definition.
 */
const IdentityRequestSchema = new Schema<IKycIdentityRequest>(
  {
    legalFirstName: { type: String, default: null },
    legalLastName: { type: String, default: null },
    legalMiddleName: { type: String, default: null },
    requestType: {
      type: String,
      enum: KYC_REQUEST_TYPES,
      default: null,
    },
    mediaContent: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    textContent: {
      type: String,
      default: null,
    },
    contentType: {
      type: String,
      enum: [
        "PASSPORT",
        "NATIONAL_IDENTITY_CARD",
        "DRIVERS_LICENSE",
        "RESIDENCE_PERMIT_OR_VISA",
      ],
      default: null,
    },
    submitMethod: {
      type: String,
      enum: ["FILE_UPLOAD", "URL", "TEXT"],
      default: "FILE_UPLOAD",
    },
    selfies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    ],
    isActive: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: KYC_REVIEW_STATUSES,
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

/**
 * Address Request Subdocument Schema definition.
 */
const AddressRequestSchema = new Schema<IKycAddressRequest>(
  {
    requestType: {
      type: String,
      enum: KYC_REQUEST_TYPES,
      default: null,
    },
    mediaContent: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    textContent: {
      type: String,
      default: null,
    },
    contentType: {
      type: String,
      enum: ["UTILITY_BILLS", "BANK_STATEMENTS", "RENTAL_AGREEMENT"],
      default: null,
    },
    submitMethod: {
      type: String,
      enum: ["FILE_UPLOAD", "URL", "TEXT"],
      default: "FILE_UPLOAD",
    },
    isActive: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewStatus: {
      type: String,
      enum: KYC_REVIEW_STATUSES,
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

/**
 * Business Request Subdocument Schema definition.
 */
const BusinessRequestSchema = new Schema<IKycBusinessRequest>(
  {
    requestType: {
      type: String,
      enum: KYC_REQUEST_TYPES,
      default: null,
    },
    mediaContent: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    textContent: {
      type: String,
      default: null,
    },
    contentType: {
      type: String,
      enum: [
        "CERTIFICATE_OF_INCORPORATION",
        "ARTICLES_OF_ORGANIZATION",
        "BUSINESS_LICENSE",
        "UBO",
        "RENTAL_AGREEMENT",
        "OFFICIAL_WEBSITE_OR_EMAIL",
      ],
      default: null,
    },
    isActive: { type: Boolean, default: false },
    submitMethod: {
      type: String,
      enum: ["FILE_UPLOAD", "URL", "TEXT"],
      default: "FILE_UPLOAD",
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewStatus: {
      type: String,
      enum: KYC_REVIEW_STATUSES,
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

/**
 * Financial Request Subdocument Schema definition.
 */
const FinanceRequestSchema = new Schema<IKycFinanceRequest>(
  {
    requestType: {
      type: String,
      enum: KYC_REQUEST_TYPES,
      default: null,
    },
    bankName: { type: String, default: null },
    accountName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    tin: { type: String, default: null },
    isActive: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewStatus: {
      type: String,
      enum: KYC_REVIEW_STATUSES,
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

/**
 * Mongoose Schema definition for KYC Request documents.
 */
const KycRequestSchema = new Schema<IKycRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    additionalLinks: [String],
    currentTier: {
      type: String,
      enum: ["NONE", "TIER_1", "TIER_2", "TIER_3", "TIER_4"],
      default: "NONE",
    },
    requestTiers: {
      identity: { type: [IdentityRequestSchema], default: [] },
      address: { type: [AddressRequestSchema], default: [] },
      business: { type: [BusinessRequestSchema], default: [] },
      finance: { type: [FinanceRequestSchema], default: [] },
    },
  },
  { timestamps: true },
);

// --- ID Verification Request Schema Index Configurations ---
KycRequestSchema.index({ userId: 1, progress: 1, createdAt: -1 });

KycRequestSchema.index({
  [KYC_REQUEST_NESTED_FIELDS.PROOFS_IDENTITY_REVIEW_STATUS]: 1,
  createdAt: 1,
});
KycRequestSchema.index({
  [KYC_REQUEST_NESTED_FIELDS.PROOFS_ADDRESS_REVIEW_STATUS]: 1,
  createdAt: 1,
});
KycRequestSchema.index({
  [KYC_REQUEST_NESTED_FIELDS.PROOFS_BUSINESS_REVIEW_STATUS]: 1,
  createdAt: 1,
});
KycRequestSchema.index({
  [KYC_REQUEST_NESTED_FIELDS.PROOFS_FINANCE_REVIEW_STATUS]: 1,
  createdAt: 1,
});

/**
 * Model Definition for KYC Verification Requests.
 */
export const KycRequestModel = model<IKycRequestDocument>(
  "KycRequest",
  KycRequestSchema,
  "kyc_requests",
);
