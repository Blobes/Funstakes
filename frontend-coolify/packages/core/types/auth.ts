"use client";

import {
  ALLOWED_VERIFICATION_METHODS,
  IDENTIFIER_TYPES,
  MESSAGING_CHANNELS,
  VERIFY_IDENTITY_METHODS,
} from "../constants/others";
import { IUser } from "./payloads/modified";
import { StepName, TransData } from "./ui-props";

export type AuthStatus =
  | "UNKNOWN"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "TEMPORARY"
  | "LOADING"
  | "ERROR";

export type VerificationReason =
  | "NEW_DEVICE"
  | "STALE_DEVICE"
  | "UNTRUSTED_DEVICE"
  | "UNVERIFIED_ACCOUNT"
  | "NEW_ACCOUNT"
  | "PASSWORD_RESET";

export type PasswordResetStepName = "CREDENTIAL" | "NEW_PASSWORD";

export type AuthStepName =
  | "INTRO"
  | "WELCOME_BACK"
  | "IDENTITY"
  | "DEMOGRAPHICS"
  | "VISUALS"
  | "PROFESSIONAL"
  | "COMPLETED"
  | "IDENTIFIER"
  | "RESTORE_ACCOUNT"
  | "PASSWORD";

export type OtpStepName = "BOT_CHALLENGE" | "VERIFY_IDENTITY";

export type VerifyIdentityMethod = keyof typeof VERIFY_IDENTITY_METHODS;
export type IdentifierType = keyof typeof IDENTIFIER_TYPES;
export type OtpMessageChannel = keyof typeof MESSAGING_CHANNELS;
export type AllowedVerificationTypes =
  keyof typeof ALLOWED_VERIFICATION_METHODS;

export type AuthPurposeType =
  | "REGISTRATION"
  | "LOGIN"
  | "PASSWORD_RESET"
  | "ACCOUNT_UPDATE";

export interface TransitPayloadMap {
  LOGIN_VERIFICATION: { user?: IUser };
  SIGNUP_VERIFICATION: { user?: IUser };
  PASSWORD_RESET: {
    identifier?: string;
    currentStep?: PasswordResetStepName;
    nextStep?: PasswordResetStepName;
  };
  MFA_ACTIVATION: { user?: IUser };
  ACCOUNT_UPDATE: { field: string; oldValue: string };
  IDENTIFIER_UPDATE: { field: string; oldValue: string };
}

export type TransitPurpose = keyof TransitPayloadMap;

export interface TransitData<P extends TransitPurpose = TransitPurpose> {
  transitId: string;
  purpose: P;
  payload?: TransitPayloadMap[P];
}

export interface BaseVerificationPayload {
  identifier?: string;
  deviceId?: string;
  otpMessageChannel?: OtpMessageChannel;
  verificationMethod?: VerifyIdentityMethod;
  authMethod?: "INTERNAL" | "OAUTH";
  dispatchOnload?: boolean;
  reason?: VerificationReason;
  text?: TransData;
}

export type VerificationTransitData<P extends TransitPurpose = TransitPurpose> =
  TransitData<P> &
    BaseVerificationPayload & {
      nextStep?: StepName;
      onVerificationSuccess?: () => void;
    };

export interface ITotpData {
  secret: string | null;
  backupCodes: string[];
  tempSecret?: string | null;
  tempBackupCodes?: string[];
}
