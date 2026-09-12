import { Document, Types } from "mongoose";
import { PostModelType } from "./post";
import { EntityType } from "./others";

export interface IFlaggedPost extends Document {
  postId: Types.ObjectId;
  postType: "GIST" | "STAKE";
  authorId: Types.ObjectId;
  violationSummary: string[];
  priority: "HIGH" | "NORMAL";
  reviewStatus: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  reviewedBy?: Types.ObjectId;
  resolutionNote?: string;
  contentSnapshot: {
    text?: string;
    media: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostReport extends Document {
  flaggedPostId: Types.ObjectId;
  reporterId: Types.ObjectId | null;
  source: "AI" | "USER";
  severity: "CRITICAL" | "MODERATE" | "LOW" | "NONE" | null;
  reason: string;
  ruleViolated: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContentModeration {
  caseId: Types.ObjectId | null;
  caseCount: number | null;
}

export type CaseResolutionAction = "APPROVED" | "REJECTED";

export type ModerationCaseStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "DISMISSED"
  | "ESCALATED"
  | "APPEALED";
export type ModerationSeverity =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
export type ModerationDecision =
  | "NONE"
  | "NO_ACTION"
  | "WARNING"
  | "CONTENT_REMOVED"
  | "CONTENT_RESTORED"
  | "STRIKE_ISSUED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "ACCOUNT_DEACTIVATED";

export type ModeratorType = "ADMIN" | "SYSTEM" | "MODERATOR";
export type ModerationSourceType = "USER" | "AI" | ModeratorType;

export type ModerationCategory =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "MISINFORMATION"
  | "IMPERSONATION"
  | "VIOLENCE"
  | "SELF_HARM"
  | "SEXUAL_CONTENT"
  | "CHILD_SAFETY"
  | "COPYRIGHT"
  | "PRIVACY"
  | "SCAM"
  | "FAKE_ACCOUNT"
  | "OTHER";
export type ModerationEvidenceType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "URL"
  | "SCREENSHOT"
  | "OCR"
  | "AI_ANALYSIS"
  | "SYSTEM_METADATA";

export interface IModerationCase extends Document {
  targetId: Types.ObjectId;
  targetType: EntityType;
  targetOwner: Types.ObjectId;
  title: string;
  description?: string | null;
  priority: ModerationSeverity;
  status: ModerationCaseStatus;
  decision: ModerationDecision;
  assignedModerator?: Types.ObjectId | null;
  resolvedBy?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  aiGenerated: boolean;
  requiresHumanReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IModerationStrike extends Document {
  account: Types.ObjectId;
  issuedBy?: Types.ObjectId | null;
  issuedByType: ModeratorType;
  category: ModerationCategory;
  severity: ModerationSeverity;
  points: number;
  reason: string;
  relatedPostType: PostModelType;
  relatedPost?: Types.ObjectId | null;
  relatedComment?: Types.ObjectId | null;
  relatedMedia?: Types.ObjectId | null;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IModerationReport extends Document {
  moderationCase: Types.ObjectId;
  reporter?: Types.ObjectId | null;
  source: ModerationSourceType;
  reason: ModerationCategory;
  description?: string | null;
  aiConfidence?: number | null;
  aiModel?: string | null;
  isDuplicate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IModerationEvidence extends Document {
  moderationCase: Types.ObjectId;
  type: ModerationEvidenceType;
  title?: string | null;
  content?: string | null;
  media: Types.ObjectId[];
  metadata?: Record<string, any> | null;
  collectedBy: ModeratorType;
  collectedByIdentity?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
