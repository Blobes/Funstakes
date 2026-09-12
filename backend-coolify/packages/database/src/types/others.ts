import { Types, Document } from "mongoose";
import { ModeratorType } from "./moderation";

export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DEACTIVATED"
  | "SUSPENDED"
  | "BANNED";
// | "NOT_ONBOARDED";
export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type UserTopicAddedBy = "USER" | "SYSTEM" | "ADMIN";

export type ChangedByType = ModeratorType | "OWNER";

export type EntityType =
  | "PROFILE"
  | "POST"
  | "COMMENT"
  | "MESSAGE"
  | "MEDIA"
  | "COMMUNITY"
  | "DEVICE";

export interface IAccountStatusHistory extends Document {
  account: Types.ObjectId;
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
  reason?: string | null;
  changedBy?: Types.ObjectId | null;
  changedByType: ChangedByType;
  suspensionExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITotpData {
  secret: string | null; // Encrypted or plain secure base32 string
  backupCodes: string[]; // Fallback recovery matrices
  tempSecret: string | null;
  tempBackupCodes: string[];
}

/**
 * Interface defining the Follow document structure.
 */
export interface IFollowDocument extends Document {
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining the Blocked User document structure.
 */
export interface IBlockedUserDocument extends Document {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining topic preference tracking subdocument.
 */
export interface IUserPreferredTopic {
  topicId: Types.ObjectId | string;
  title: string;
  addedBy?: UserTopicAddedBy;
  lastViewed?: Date;
}
export interface ITopicDocument extends Document {
  title: string;
  oldTitle?: string | null;
  userCount: number;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISecurityQuestionItem {
  question: string;
  answerHash: string;
}
export interface ISecurityQuestionDocument extends Document {
  userId: Types.ObjectId;
  questions: ISecurityQuestionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocation {
  continent?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  region?: string | null;
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}
