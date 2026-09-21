"use client";

import { ILocation, SupportedIsoCode } from "@repo/core";
import { AuthStepName, ITotpData } from "../auth";

export type UserRole = "USER" | "ADMIN" | "MODERATOR";
export type AccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "DEACTIVATED"
  | "SUSPENDED"
  | "BANNED"
  | "NOT_ONBOARDED"
  | "NOT_VERIFIED";
export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

interface PreferredTopics {
  topicId: string;
  title: string;
  lastViewed?: string | null;
}

/**
 * Interface representing the Device document in MongoDB.
 */
export interface ITrustedDevice {
  _id?: string;
  userId: string;
  deviceToken: string;
  name: string | null;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipHash?: string;
  lastCountry?: string;
  isPrimary: boolean;
  isStale: boolean;
  lastSeenAt: Date;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPayload {
  // --- CORE IDENTITY ---
  _id: string;
  email?: string;
  username?: string;
  usernameCanonical?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;

  // --- AUTHENTICATION & SECURITY ---
  signedUpWith?: "EMAIL" | "GOOGLE" | "APPLE";
  oAuthId?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  lastPasswordVerifiedAt?: Date | null;
  totpAuth?: ITotpData;
  hasEnabledMFA?: boolean;
  securityQuestionsId?: string | null;

  // --- OTP VERIFICATION ---
  lastEmailCodeSentAt?: Date | string | null;
  lastPhoneCodeSentAt?: Date | string | null;

  // --- IDENTITY UPDATES ---
  pendingEmail?: string | null;
  pendingPhoneNumber?: string | null;
  lastEmailChangeAt?: Date | string | null;
  lastPhoneChangeAt?: Date | string | null;
  lastUsernameChangeAt?: Date | string | null;

  // --- ROLES & AUTHORIZATION ---
  role?: UserRole;

  // --- VERIFICATION & NOTABILITY ---
  isVerified?: boolean;
  isPublicFigure?: boolean;
  meritsVerification?: boolean;
  isNotable?: boolean;
  idVerificationRequest?: string | null;
  idVerificationStatus?: VerificationStatus;
  verificationSignals?: {
    hasWikipedia: boolean;
    isVipEmail: boolean;
    isVipPhone: boolean;
  };
  isAgeVerified?: boolean;

  // --- ACCOUNT STATUS UPDATES ---
  accountStatus?: AccountStatus;
  statusChangedAt?: Date | string | null;
  statusReason?: string;
  statusChangedBy?: string | null;
  lastActiveAt?: Date | string | null;
  deactivatedAt?: string | null;

  // --- USER DEVICES ---
  primaryDeviceId?: string | null;
  trustedDevices?: ITrustedDevice[];

  // --- PROFILE DETAILS ---
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  interests?: string[];
  website?: string | null;

  // --- USER PROFILE ASSETS ---
  profileImage?: string | null;
  coverImage?: string | null;

  // --- ONBOARDING & GEOGRAPHY ---
  isOnboarded?: boolean;
  onboardingStep?: AuthStepName | null;

  // --- ACCOUNT LOCATION & USER ADDRESS ---
  location?: ILocation | null; // Computed by system
  address?: string | null; // Provided by user

  // --- METRICS & PREFERENCES ---
  followersCount?: number;
  followingCount?: number;
  preferences?: {
    showSensitiveGraphic: boolean;
    preferredLanguage: SupportedIsoCode;
    preferredTopics: PreferredTopics[];
  };

  // --- MODERATION FIELDS ---
  policyBreachCount?: number;
  hasFlaggedPost?: boolean;
  postCountWindow?: number;

  // --- LIFECYCLE ---
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}
