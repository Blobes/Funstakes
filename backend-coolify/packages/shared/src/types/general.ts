import {
  AccountStatus,
  GistModel,
  IMedia,
  PostContentStatus,
  ModerationSeverity,
  RoleName,
  PermissionName,
  SubscriptionTier,
  SubscriptionStatus,
  UserTopicAddedBy,
} from "@repo/database";
import { Request, RequestHandler } from "express";
import mongoose, { InferSchemaType } from "mongoose";
import { AuthorizationContext } from "./authorization";

export type VerificationMethod = "MESSAGING" | "TOTP" | "SECURITY_QUESTIONS";

export type AppName =
  | "PLATFORM_SERVICE"
  | "ACCOUNT_SERVICE"
  | "POST_SERVICE"
  | "WORKER_SERVICE"
  | "GATEWAY";

export type PostType = "GIST" | "STAKE";

export type ModerationTaskMode =
  | "MODERATE_ONLY"
  | "MODERATE_AND_EXTRACT_KEYWORDS"
  | "EXTRACT_KEYWORDS_ONLY";

export type OtpIdentifierType = "EMAIL" | "PHONE_NUMBER";

export type OtpMessageChannel = "EMAIL" | "SMS" | "WHATSAPP";

export type InputCheckType = OtpIdentifierType | "USERNAME";

export type Role = "USER" | "ADMIN" | "MODERATOR";

export type OtpActionType =
  | "LOGIN_VERIFICATION"
  | "SIGNUP_VERIFICATION"
  | "IDENTIFIER_UPDATE"
  | "PASSWORD_RESET"
  | "MFA_ACTIVATION"
  | "MFA_DEACTIVATION";

/**
 * Represents the signed JWT user payload.
 */
export interface IJwtUser {
  id: string;
  deviceId: string;
  sessionId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  accountStatus?: AccountStatus;
  roles: RoleName[];
  permissions?: PermissionName[];
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
}

/**
 * Express Request extension carrying resolved security claims.
 */
export interface IAuthRequest extends Request {
  user?: IJwtUser;
  authContext?: AuthorizationContext;
}

export type IGist = InferSchemaType<typeof GistModel.schema>;

export interface IBasePost {
  id: any;
  authorId: any;
  topics?: string[];
  location?: {
    name?: string;
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  hasSensitiveGraphic?: boolean;
  [key: string]: any; // Allows for post-specific fields (e.g., gist content, video URL)
}

export interface IAuthConfig {
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
}

export interface IVerifyAuth {
  verifyAuthToken: RequestHandler;
  optionalAuth?: RequestHandler;
}

export interface IInternalTokenConfig {
  INTERNAL_TOKEN_SECRET: string;
}
export interface IValidateInternalToken {
  validateInternalToken: RequestHandler;
}

export interface IS3Config {
  REGION: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
  BUCKET_NAME: string;
  ENDPOINT_URL: string;
  PUBLIC_URL: string;
}

export interface IUploadConfig extends IVerifyAuth, IValidateInternalToken {
  uploadConfig: IS3Config;
}

export interface IEmailDispatchTokens {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SMTP_HOST_EMAIL?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
}

export interface IPhoneDispatchTokens {
  WHATSAPP_API_URL?: string;
  WHATSAPP_ACCESS_KEY?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
  LOCAL_SMS_API_KEY?: string;
  LOCAL_SMS_SENDER_ID?: string;
  GLOBAL_SMS_SENDER_ID?: string;
  GLOBAL_SMS_API_KEY?: string;
}

export interface ICodeDispatchTokens
  extends IEmailDispatchTokens, IPhoneDispatchTokens {}

export interface OtpJobPayload {
  type: OtpMessageChannel;
  code: string;
  email?: string;
  phone?: string;
  firstName?: string;
}

export interface IModResult {
  extractedTopics: string[];
  severity: ModerationSeverity | null;
  ruleViolated: string | null;
  reason: string | null;
  needsReview: boolean;
  status: PostContentStatus;
  newTopicsFromAi?: string[];
  hasSensitiveGraphic?: boolean;
  topicsSource?: UserTopicAddedBy;
}

type ModEventType = "POST_CREATION" | "POST_UPDATE";

export interface FinalizePostReq {
  postId: string;
  userId: string;
  postType: PostType;
  caption?: string;
  media: IMedia[];
  event: ModEventType;
  topicsSource?: UserTopicAddedBy;
  modResult: IModResult;
  session: mongoose.ClientSession;
}

export interface IPostModData {
  postId: string;
  postType: PostType;
  userId: string;
  caption?: string;
  media?: IMedia[];
  topics?: string[];
  topicsSource?: UserTopicAddedBy;
  event: ModEventType;
  moderationTaskMode: ModerationTaskMode;
}

export interface TransInfo {
  readonly i18nKey?: string;
  readonly message?: string;
  readonly interpolations?: Record<string, any>;
}

export interface UserSettingsResult {
  status: "SUCCESS" | "NOT_FOUND" | "INVALID_INPUT";
  transInfo: TransInfo;
  payload?: any;
}
