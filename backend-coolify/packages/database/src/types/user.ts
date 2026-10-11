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
  IPublicFigureSignals,
  ITotpData,
  OAuthProvider,
} from "./others";
import { KycTierType } from "./kyc";

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
  displayName?: string;
  legalName?: string;
  password?: string | null;
  phoneNumber?: string;
  phoneNumberHash?: string;

  // --- AUTHENTICATION & SECURITY ---
  signedUpWith?: "EMAIL" | OAuthProvider;
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
  kyc?: {
    kycId?: Types.ObjectId | null;
    currentTier?: KycTierType;
  };
  verifiedBadge?: {
    badgeId?: Types.ObjectId | null;
    isEligible?: boolean;
  };
  publicFigureInfo?: {
    publicFigureId?: Types.ObjectId | null;
    isEligible?: boolean;
    signals?: IPublicFigureSignals;
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
  createdAt?: Date;
  updatedAt?: Date;
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
