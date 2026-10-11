import { model, Schema } from "mongoose";
import {
  IPublicFigureDocument,
  IPublicFigureRequestDocument,
  IPublicFigureSignals,
} from "../../../types/others";

const SignalsSchema = new Schema<IPublicFigureSignals>(
  {
    hasWikipedia: { type: Boolean, default: false },
    hasVipEmail: { type: Boolean, default: false },
    hasVipPhone: { type: Boolean, default: false },
    hasPressCoverage: { type: Boolean, default: false },
    isSearchVerified: { type: Boolean, default: false },
  },
  { _id: false },
);

const PublicFigureRequestSchema = new Schema<IPublicFigureRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publicName: {
      type: String,
      default: null,
      trim: true,
    },
    legalName: {
      type: String,
      default: null,
      trim: true,
    },
    publicEmail: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: [
        "POLITICIAN",
        "ARTISTE",
        "ENTREPRENEUR",
        "ATHLETE",
        "JOURNALIST",
        "CONTENT_CREATOR",
        "EXECUTIVE",
        "ACADEMIC",
        "GOVERNMENT_OFFICIAL",
        "ORGANIZATION",
      ],
      required: true,
    },
    notabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    networth: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    milestone: {
      type: String,
      default: null,
      trim: true,
    },
    notableWorks: {
      type: [String],
      default: [],
    },
    officialWebsite: {
      type: String,
      default: null,
      trim: true,
    },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
    signals: {
      type: SignalsSchema,
      default: () => ({}),
    },
    reviewStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED"],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedByType: {
      type: String,
      enum: ["ADMIN", "SYSTEM"],
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

PublicFigureRequestSchema.index({ userId: 1 });
PublicFigureRequestSchema.index({ category: 1 });
PublicFigureRequestSchema.index({ reviewStatus: 1 });
PublicFigureRequestSchema.index({ userId: 1, reviewStatus: 1 });
PublicFigureRequestSchema.index({ reviewStatus: 1, category: 1 });

export const PublicFigureRequestModel = model<IPublicFigureRequestDocument>(
  "PublicFigureRequest",
  PublicFigureRequestSchema,
  "public_figure_requests",
);

const PublicFigureSchema = new Schema<IPublicFigureDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "PublicFigureRequest",
      default: null,
    },
    publicName: {
      type: String,
      default: null,
      trim: true,
    },
    legalName: {
      type: String,
      default: null,
      trim: true,
    },
    publicEmail: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "REVOKED"],
      default: "ACTIVE",
    },
    category: {
      type: String,
      enum: [
        "POLITICIAN",
        "ARTISTE",
        "ENTREPRENEUR",
        "ATHLETE",
        "JOURNALIST",
        "CONTENT_CREATOR",
        "EXECUTIVE",
        "ACADEMIC",
        "GOVERNMENT_OFFICIAL",
        "ORGANIZATION",
      ],
      required: true,
    },
    notabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    networth: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    milestone: {
      type: String,
      default: null,
      trim: true,
    },
    notableWorks: {
      type: [String],
      default: [],
    },
    officialWebsite: {
      type: String,
      default: null,
      trim: true,
    },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
    signals: {
      type: SignalsSchema,
      default: () => ({}),
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revokedByType: {
      type: String,
      enum: ["ADMIN", "SYSTEM"],
      default: null,
    },
    revocationReason: {
      type: String,
      default: null,
      trim: true,
    },
    lastExternalRefreshAt: { type: Date, default: null },
  },
  { timestamps: true },
);

PublicFigureSchema.index({ userId: 1 }, { unique: true });
PublicFigureSchema.index({ requestId: 1 });
PublicFigureSchema.index({ status: 1 });
PublicFigureSchema.index({ category: 1 });
PublicFigureSchema.index({ status: 1, category: 1 });

export const PublicFigureModel = model<IPublicFigureDocument>(
  "PublicFigure",
  PublicFigureSchema,
  "public_figures",
);
