import {
  Document,
  Model,
  Query,
  Types,
  QueryOptions,
  QueryFilter,
} from "mongoose";
import {
  AccountStatus,
  ILocation,
  ITotpData,
  IUserPreferredTopic,
  VerificationStatus,
} from "./others";

export type AccountVisibility = "PRIVATE" | "PUBLIC";

/**
 * Interface defining user models.
 */
export interface IUserDocument extends Document {
  // --- CORE IDENTITY ---
  email: string;
  emailHash?: string;
  username?: string;
  usernameCanonical?: string;
  password?: string | null;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneNumberHash?: string;

  // --- AUTHENTICATION & SECURITY ---
  signedUpWith?: "EMAIL" | "GOOGLE" | "APPLE";
  oAuthId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  primaryDeviceId?: Types.ObjectId | string | null;
  lastPasswordVerifiedAt?: Date | null;
  totpAuth: ITotpData;
  hasEnabledMFA?: boolean;
  securityQuestionsId?: Types.ObjectId | null;

  // --- OTP VERIFICATION ---
  otpCode?: string | null;
  otpCodeExpiresAt?: Date | null;
  lastEmailOtpSentAt?: Date | null;
  lastPhoneOtpSentAt: Date | null;

  // --- IDENTITY UPDATES ---
  pendingEmail?: string | null;
  pendingPhoneNumber?: string | null;
  lastEmailChangeAt?: Date | null;
  lastPhoneChangeAt?: Date | null;
  lastUsernameChangeAt?: Date | null;

  // --- ID VERIFICATION & NOTABILITY ---
  isKycVerified: boolean;
  isPublicFigure: boolean;
  meritsVerification: boolean;
  isNotable: boolean;
  kycSubmitRequest?: Types.ObjectId | null;
  kycReviewStatus: VerificationStatus;
  verificationSignals: {
    hasWikipedia: boolean;
    isVipEmail: boolean;
    isVipPhone: boolean;
  };
  isAgeVerified: boolean;

  // --- ACCOUNT STATUS & VISIBILITY ---
  accountStatus: AccountStatus;
  accountVisibility?: AccountVisibility;
  lastActiveAt?: Date | null;
  statusChangedAt?: Date | null;
  statusReason?: string;
  statusChangedBy?: Types.ObjectId | null;

  // --- PROFILE DETAILS ---
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  interests: string[]; // Might not be needed again since we have user preffered topics
  website?: string | null;

  // --- PROFILE ASSETS ---
  profileImage?: Types.ObjectId | null;
  coverImage?: Types.ObjectId | null;

  // --- ONBOARDING & GEOGRAPHY ---
  isOnboarded?: boolean;
  onboardingStep?: string | null;

  // --- ACCOUNT LOCATION & USER ADDRESS ---
  location?: ILocation | null; // Computed by system
  address?: string | null; // Provided by user

  // --- METRICS & PREFERENCES ---
  followersCount: number;
  followingCount: number;

  // --- MODERATION FIELDS ---
  policyBreachCount?: number;
  hasFlaggedPost: boolean;
  postCountWindow: number;

  // --- LIFECYCLE ---
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type QFilter = QueryFilter<IUserDocument>;

export interface QueryConfig {
  filter?: QFilter;
  options?: QueryOptions;
}
export interface IUserModelStatic extends Model<IUserDocument> {
  findByEncryptedField(
    fieldName: string,
    plainValue: string,
    filter?: QFilter,
    options?: QueryOptions,
  ): Query<IUserDocument | null, IUserDocument>;
  findByEmail(
    config: QueryConfig & { email: string },
  ): Query<IUserDocument | null, IUserDocument>;
  findByPhone(
    config: QueryConfig & { phoneNumber: string },
  ): Query<IUserDocument | null, IUserDocument>;
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

export type SubscriptionTier = "FREE" | "PREMIUM" | "ENTERPRISE";
export type SubscriptionStatus =
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID";

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
