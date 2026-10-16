import {
  Document,
  Model,
  Query,
  Types,
  QueryOptions,
  QueryFilter,
} from "mongoose";
import { AccountStatus, ILocation, ITotpData, OAuthProvider } from "./others";
import { KycTierType } from "./kyc";
import { IPublicFigureSignals } from "./publicFigure";

export type AccountVisibility = "PRIVATE" | "PUBLIC";
export type AccountRepType =
  | "UNKNOWN"
  | "PERSONAL"
  | "FAN"
  | "PARODY"
  | "COMMENTARY"
  | "ROLEPLAY"
  | "ORGANIZATION";

export type UserAffiliationRole =
  | "EMPLOYEE"
  | "MEMBER"
  | "CONTRACTOR"
  | "FOUNDER"
  | "OTHER";

export type UserAffiliationStatus =
  | "PENDING"
  | "VERIFIED"
  | "INACTIVE"
  | "REJECTED";

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

  // --- ACCOUNT REPRESENTATION ---
  accountRepresentation?: {
    repType?: AccountRepType;
    pendingRepType?: AccountRepType | null;
    subjectLabel?: string | null; // The label of the subject of the account representation, e.g. "John Doe"
    disclosureAcceptedAt: string | null; // Date the user accepted the disclosure terms
  };
  affiliation?: {
    organizationId?: Types.ObjectId | null;
    status?: UserAffiliationStatus | null;
    role?: UserAffiliationRole | null;
    orgEmail?: string | null; // work email used for OTP
    verifiedAt?: Date | null;
  };

  // --- PROFILE DETAILS ---
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?:
    | "SINGLE"
    | "IN_A_RELATIONSHIP"
    | "MARRIED"
    | "DIVORCED"
    | "WIDOWED"
    | "OTHER"
    | null;
  website?: string | null;

  // --- PROFILE ASSETS ---
  profileImage?: Types.ObjectId | null;
  coverImage?: Types.ObjectId | null;

  // --- ONBOARDING & GEOGRAPHY ---
  isOnboarded?: boolean;
  onboardingStep?: string | null;

  // --- ACCOUNT LOCATION & USER ADDRESS ---
  location?: ILocation | null; // Computed by system dynamically
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
