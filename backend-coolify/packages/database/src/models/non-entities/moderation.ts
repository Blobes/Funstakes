import { Schema, model, Model } from "mongoose";
import {
  IModerationCase,
  IModerationEvidence,
  IModerationReport,
  IModerationStrike,
} from "../../types/moderation";

// Unique Cases Records
export const ModerationCaseSchema = new Schema<IModerationCase>(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["PROFILE", "POST", "COMMENT", "MESSAGE", "MEDIA", "COMMUNITY"],
    },
    targetOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: [
        "OPEN",
        "UNDER_REVIEW",
        "RESOLVED",
        "DISMISSED",
        "ESCALATED",
        "APPEALED",
      ],
      default: "OPEN",
    },
    decision: {
      type: String,
      enum: [
        "NONE",
        "NO_ACTION",
        "WARNING",
        "CONTENT_REMOVED",
        "CONTENT_RESTORED",
        "STRIKE_ISSUED",
        "ACCOUNT_SUSPENDED",
        "ACCOUNT_BANNED",
        "ACCOUNT_DEACTIVATED",
      ],
      default: "NONE",
    },
    assignedModerator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "UserRole",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    requiresHumanReview: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Moderation Case Schema Indexes
ModerationCaseSchema.index({ targetId: 1 });
ModerationCaseSchema.index({ targetType: 1 });
ModerationCaseSchema.index({ targetOwner: 1 });
ModerationCaseSchema.index({ priority: 1 });
ModerationCaseSchema.index({ status: 1 });
ModerationCaseSchema.index({ assignedModerator: 1 });
ModerationCaseSchema.index({ aiGenerated: 1 });
ModerationCaseSchema.index({
  status: 1,
  priority: -1,
  createdAt: -1,
});
ModerationCaseSchema.index({
  targetType: 1,
  targetId: 1,
});
ModerationCaseSchema.index({
  targetOwner: 1,
  createdAt: -1,
});

/**
 * Model schema for tracking unique content and account moderation cases.
 */
export const ModerationCaseModel: Model<IModerationCase> = model(
  "ModerationCase",
  ModerationCaseSchema,
  "moderation_cases",
);

// Penalized Accounts
export const ModerationStrikeSchema = new Schema<IModerationStrike>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issuedByType: {
      type: String,
      enum: ["SYSTEM", "ADMIN", "MODERATOR"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "SPAM",
        "HARASSMENT",
        "HATE_SPEECH",
        "MISINFORMATION",
        "IMPERSONATION",
        "VIOLENCE",
        "SELF_HARM",
        "SEXUAL_CONTENT",
        "CHILD_SAFETY",
        "COPYRIGHT",
        "PRIVACY",
        "SCAM",
        "FAKE_ACCOUNT",
        "OTHER",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    relatedPostType: {
      type: String,
      enum: ["Gist", "Stake"],
      default: null,
    },
    relatedPost: {
      type: Schema.Types.ObjectId,
      refPath: "relatedPostType",
      default: null,
    },
    relatedComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Moderation Strike Schema Indexes
ModerationStrikeSchema.index({ account: 1, createdAt: -1 });
ModerationStrikeSchema.index({ account: 1, isActive: 1 });
ModerationStrikeSchema.index(
  { expiresAt: 1 },
  { partialFilterExpression: { expiresAt: { $type: "date" } } },
);

/**
 * Model schema for tracking penalization strikes and policy violations issued against accounts.
 */
export const ModerationStrikeModel: Model<IModerationStrike> = model(
  "ModerationStrike",
  ModerationStrikeSchema,
  "moderation_strikes",
);

// Reported cases
export const ModerationReportSchema = new Schema<IModerationReport>(
  {
    moderationCase: {
      type: Schema.Types.ObjectId,
      ref: "ModerationCase",
      required: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      enum: ["USER", "AI", "SYSTEM", "MODERATOR"],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "SPAM",
        "HARASSMENT",
        "HATE_SPEECH",
        "MISINFORMATION",
        "IMPERSONATION",
        "VIOLENCE",
        "SELF_HARM",
        "SEXUAL_CONTENT",
        "CHILD_SAFETY",
        "COPYRIGHT",
        "PRIVACY",
        "SCAM",
        "FAKE_ACCOUNT",
        "OTHER",
      ],
      required: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    aiConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    aiModel: {
      type: String,
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Moderation Report Schema Indexes
ModerationReportSchema.index({
  moderationCase: 1,
  createdAt: -1,
});
ModerationReportSchema.index({
  reporter: 1,
  createdAt: -1,
});
ModerationReportSchema.index({
  source: 1,
  reason: 1,
});

/**
 * Model schema for storing user, AI, and system-submitted violation reports tied to moderation cases.
 */
export const ModerationReportModel: Model<IModerationReport> = model(
  "ModerationReport",
  ModerationReportSchema,
  "moderation_reports",
);

// Evidence Records
export const ModerationEvidenceSchema = new Schema<IModerationEvidence>(
  {
    moderationCase: {
      type: Schema.Types.ObjectId,
      ref: "ModerationCase",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "TEXT",
        "IMAGE",
        "VIDEO",
        "AUDIO",
        "DOCUMENT",
        "URL",
        "SCREENSHOT",
        "OCR",
        "AI_ANALYSIS",
        "SYSTEM_METADATA",
      ],
      required: true,
    },
    title: {
      type: String,
      default: null,
      trim: true,
    },
    content: {
      type: String,
      default: null,
    },
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media",
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    collectedBy: {
      type: String,
      enum: ["SYSTEM", "AI", "MODERATOR"],
      required: true,
    },
    collectedByIdentity: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// Moderation Evidence Schema Indexes
ModerationEvidenceSchema.index({
  moderationCase: 1,
  type: 1,
});

/**
 * Model schema for storing media, text, and technical evidence collected for moderation review.
 */
export const ModerationEvidenceModel: Model<IModerationEvidence> = model(
  "ModerationEvidence",
  ModerationEvidenceSchema,
  "moderation_evidence",
);
