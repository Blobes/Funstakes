"use client";

import {
  ALLOWED_VERIFICATION_METHODS,
  IDENTIFIER_TYPES,
  MESSAGING_CHANNELS,
  VERIFY_IDENTITY_METHODS,
} from "../constants/others";
import { IUser } from "./payloads/modified";
import { StepName } from "./ui-props";

export type AuthStatus =
  | "UNKNOWN"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "TEMPORARY"
  | "LOADING"
  | "ERROR";

export type OtpReason =
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

export type CheckPurpose =
  | "REGISTRATION"
  | "LOGIN"
  | "PASSWORD_RESET"
  | "ACCOUNT_UPDATE";

export interface TransitPayloadMap {
  LOGIN_VERIFICATION: IUser;
  SIGNUP_VERIFICATION: IUser;
  ACCOUNT_UPDATE: { field: string; oldValue: string };
  IDENTIFIER_UPDATE: { field: string; oldValue: string };
  PASSWORD_RESET: {
    currentStep?: PasswordResetStepName;
    nextStep?: PasswordResetStepName;
    identifier?: string;
  };
  MFA_ACTIVATION: IUser;
}

export type TransitPurpose = keyof TransitPayloadMap;

export interface TransitData<P extends TransitPurpose = TransitPurpose> {
  transitId: string;
  purpose: P;
  payload?: TransitPayloadMap[P];
}

export type OtpTransitData<P extends TransitPurpose = TransitPurpose> =
  TransitData<P> & {
    identifier?: string;
    otpMessageChannel: OtpMessageChannel;
    verificationMethod?: VerifyIdentityMethod;
    reason: OtpReason;
    dispatchOnload?: boolean;
    nextStep?: StepName;
    onVerificationSuccess?: () => void;
  };

export interface ITotpData {
  secret: string | null;
  backupCodes: string[];
  tempSecret?: string | null;
  tempBackupCodes?: string[];
}
