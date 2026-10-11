import { Types, Document } from "mongoose";
import { ModeratorType } from "./moderation";
import { PostModelType } from "./post";

export type ResourceStatus = "ACTIVE" | "INACTIVE" | "REVOKED";

export type AccountStatus =
  | ResourceStatus
  | "DEACTIVATED"
  | "SUSPENDED"
  | "BANNED";
// | "NOT_ONBOARDED";

export type ResourceType = "USER" | "SYSTEM" | "ADMIN";
export type ChangedByType = ModeratorType | "OWNER";
export type EntityType =
  | "PROFILE"
  | "POST"
  | "COMMENT"
  | "MESSAGE"
  | "MEDIA"
  | "COMMUNITY"
  | "DEVICE";

export type PublicFigureCategory =
  | "POLITICIAN"
  | "ARTISTE"
  | "ENTREPRENEUR"
  | "ATHLETE"
  | "JOURNALIST"
  | "CONTENT_CREATOR"
  | "EXECUTIVE"
  | "ACADEMIC"
  | "GOVERNMENT_OFFICIAL"
  | "ORGANIZATION";

export type ReviewStatus =
  | "APPROVED"
  | "DENIED"
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED";

export type SubscriptionTier = "FREE" | "PREMIUM" | "ENTERPRISE";
export type SubscriptionStatus =
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID";

export type OAuthProvider =
  | "GOOGLE"
  | "APPLE"
  | "FACEBOOK"
  | "X"
  | "LINKEDIN"
  | "GITHUB";

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
  addedBy?: ResourceType;
  lastViewed?: Date;
}
export interface ITopicDocument extends Document {
  title: string;
  oldTitle?: string | null;
  userCount: number;
  postCount: number;
  createdById?: Types.ObjectId | null;
  createdByType?: ResourceType;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiSuggestedTopicDocument extends Document {
  title: string;
  relatedPostId?: Types.ObjectId | string;
  relatedPostType?: PostModelType;
  status: ReviewStatus;
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
  name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  region?: string | null;
  continent?: string | null;
  continentCode?: string | null;
  type?: "Point";
  coordinates?: [number, number]; // [longitude, latitude]
  isVpnOrProxy?: boolean;
  lastVerifiedAt?: Date | null;
}

/**
 * Interface defining granular global user settings.
 */
export interface IUserSettingsDocument {
  userId: Types.ObjectId;
  privacy: {
    isPrivateAccount: boolean;
    discoverability: {
      searchIndexing: boolean;
      contactSync: boolean;
      recommendToOthers: boolean;
    };
    directMessaging: "EVERYONE" | "FOLLOWERS" | "NO_ONE";
    mentionsAndTagging: "EVERYONE" | "FOLLOWERS" | "NO_ONE";
  };
  notifications: {
    push: {
      enabled: boolean;
      likes: boolean;
      comments: boolean;
      mentions: boolean;
      newFollowers: boolean;
      directMessages: boolean;
      systemAnnouncements: boolean;
    };
    email: {
      enabled: boolean;
      digest: boolean;
      directMessages: boolean;
      securityAlerts: boolean;
    };
    quietMode: {
      isEnabled: boolean;
      startTime: string; // HH:mm format, e.g., "22:00"
      endTime: string; // HH:mm format, e.g., "07:00"
      timeZone: string; // e.g., "Africa/Lagos" or "UTC"
    };
  };
  display: {
    theme: "SYSTEM" | "LIGHT" | "DARK";
    showSensitiveMedia: boolean;
    accessibility: {
      reduceMotion: boolean;
      highContrast: boolean;
      fontScale: number;
      autoPlayMedia: "ALWAYS" | "WIFI_ONLY" | "NEVER";
    };
    localization: {
      language: string;
      currency: string;
    };
    contentPreferences: {
      preferredTopics: IUserPreferredTopic[];
      mutedWords: string[];
    };
  };
  mutedWords: string[];
}

/**
 * Interface defining user logs.
 */
export interface IUserLogDocument {
  userId: Types.ObjectId;
  action: string;
  category: "AUTH" | "PROFILE" | "SECURITY" | "TRANSACTION" | "MODERATION";
  ipAddress?: string;
  userAgent?: string;
  deviceId?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Interface defining error logs.
 */
export interface IErrorLogDocument {
  userId?: Types.ObjectId;
  errorCode: string;
  route?: string;
  method?: string;
  statusCode: number;
  i18nKey?: string;
  message: string;
  stackTrace?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ISubscriptionDocument extends Document {
  userId: Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for user-specific device settings.
 */
export interface IDeviceUserMeta {
  userId: Types.ObjectId;
  isPrimary: boolean;
  isVerified: boolean;
}

/**
 * Interface representing the Device document in MongoDB shared across multiple users.
 */
export interface IDeviceDocument extends Document {
  users: IDeviceUserMeta[];
  deviceToken: string;
  name: string | null;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipHash?: string;
  lastCountry?: string;
  isStale: boolean;
  lastSeenAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVerifiedBadgeDocument extends Document {
  userId: Types.ObjectId;
  status: "ACTIVE" | "INACTIVE" | "REVOKED";
  subscriptionTier: SubscriptionTier;
  issuedAt: Date;
  revokedAt?: Date | null;
  revokedReason?: string | null;
}

export interface IPublicFigureSignals {
  hasWikipedia?: boolean;
  hasVipEmail?: boolean;
  hasVipPhone?: boolean;
  hasPressCoverage?: boolean;
  isSearchVerified?: boolean;
}

export interface IPublicFigureBase {
  publicName?: string | null;
  legalName?: string | null;
  publicEmail?: string | null;
  accountEmail?: string | null;
  category?: PublicFigureCategory;
  notabilityScore: number;
  networth?: string | null;
  description?: string | null;
  milestone?: string | null;
  notableWorks?: string[];
  officialWebsite?: string | null;
  socialLinks?: Record<string, string>;
  signals?: IPublicFigureSignals;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPublicFigureRequest extends IPublicFigureBase {
  userId: Types.ObjectId;
  reviewStatus?: ReviewStatus;
  rejectionReason?: string | null;
  reviewedBy?: Types.ObjectId | null;
  reviewedByType?: ResourceType | null;
  reviewedAt?: Date | null;
}

export interface IPublicFigureRequestDocument
  extends IPublicFigureRequest, Document {}

export interface IPublicFigure extends IPublicFigureBase {
  userId: Types.ObjectId;
  requestId?: Types.ObjectId | null;
  status?: ResourceStatus;
  revokedAt?: Date | null;
  revokedBy?: Types.ObjectId | null;
  revokedByType?: ResourceType | null;
  revocationReason?: string | null;
  lastExternalRefreshAt?: Date | null;
}

export interface IPublicFigureDocument extends IPublicFigure, Document {}
