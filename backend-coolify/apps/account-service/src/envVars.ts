import type { RequestHandler } from "express";
import {
  ENV_KEYS,
  IAuthConfig,
  ICodeDispatchTokens,
  IEmailDispatchTokens,
  IPhoneDispatchTokens,
  IS3Config,
  getEnv,
  loadEnv,
} from "@repo/shared";
import { verifyAuthOptionally, verifyAuthTokens } from "@repo/security";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

/**
 * Core Application Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv(ENV_KEYS.NODE_ENV);
  },
  get MONGO_URI() {
    return getEnv(ENV_KEYS.MONGO_URI);
  },
  get PORT() {
    return parseInt(getEnv(ENV_KEYS.ACCOUNT_PORT, false) || "8085", 10);
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv(ENV_KEYS.FUNSTAKES_REDIS_URL);
  },
  get GATEWAY_URL() {
    return getEnv(ENV_KEYS.GATEWAY_URL);
  },
  get FRONTEND_URL() {
    return getEnv(ENV_KEYS.FRONTEND_URL);
  },
};

/**
 * Authentication Configuration
 */
export const authTokens: IAuthConfig = {
  get ACCESS_TOKEN_SECRET() {
    return getEnv(ENV_KEYS.JWT_SECRET);
  },
  get REFRESH_TOKEN_SECRET() {
    return getEnv(ENV_KEYS.REFRESH_TOKEN_SECRET);
  },
};

export const oauthId = {
  get GOOGLE_CLIENT_ID() {
    return getEnv(ENV_KEYS.GOOGLE_CLIENT_ID);
  },
  get GOOGLE_CLIENT_SECRET() {
    return getEnv(ENV_KEYS.GOOGLE_CLIENT_SECRET);
  },
  get APPLE_CLIENT_ID() {
    return getEnv(ENV_KEYS.APPLE_CLIENT_ID);
  },
  get APPLE_CLIENT_SECRET() {
    return getEnv(ENV_KEYS.APPLE_CLIENT_SECRET);
  },
  get FACEBOOK_CLIENT_ID() {
    return getEnv(ENV_KEYS.FACEBOOK_CLIENT_ID);
  },
  get FACEBOOK_CLIENT_SECRET() {
    return getEnv(ENV_KEYS.FACEBOOK_CLIENT_SECRET);
  },
  get X_CLIENT_ID() {
    return getEnv(ENV_KEYS.X_CLIENT_ID);
  },
  get X_CLIENT_SECRET() {
    return getEnv(ENV_KEYS.X_CLIENT_SECRET);
  },
  get LINKEDIN_CLIENT_ID() {
    return getEnv(ENV_KEYS.LINKEDIN_CLIENT_ID);
  },
  get LINKEDIN_CLIENT_SECRET() {
    return getEnv(ENV_KEYS.LINKEDIN_CLIENT_SECRET);
  },
  get GITHUB_CLIENT_ID() {
    return getEnv(ENV_KEYS.GITHUB_CLIENT_ID);
  },
  get GITHUB_CLIENT_SECRET() {
    return getEnv(ENV_KEYS.GITHUB_CLIENT_SECRET);
  },
};

/**
 * Email Provider Configuration
 */
export const emailDispatchTokens: IEmailDispatchTokens = {
  get RESEND_API_KEY() {
    return getEnv(ENV_KEYS.RESEND_API_KEY, false);
  },
  get RESEND_FROM_EMAIL() {
    return getEnv(ENV_KEYS.RESEND_FROM, false);
  },
  get SMTP_HOST_EMAIL() {
    return getEnv(ENV_KEYS.SMTP_HOST_EMAIL, false);
  },
  get SMTP_PORT() {
    return getEnv(ENV_KEYS.SMTP_HOST_PORT, false);
  },
  get SMTP_USER() {
    return getEnv(ENV_KEYS.SMTP_USERNAME, false);
  },
  get SMTP_PASSWORD() {
    return getEnv(ENV_KEYS.SMTP_USER_PASSWORD, false);
  },
};

/**
 * Phone and WhatsApp Configuration
 */
export const phoneDispatchTokens: IPhoneDispatchTokens = {
  get WHATSAPP_API_URL() {
    return getEnv(ENV_KEYS.WHATSAPP_API_URL, false);
  },
  get WHATSAPP_ACCESS_KEY() {
    return getEnv(ENV_KEYS.WHATSAPP_ACCESS_KEY, false);
  },
  get WHATSAPP_PHONE_NUMBER_ID() {
    return getEnv(ENV_KEYS.WHATSAPP_PHONE_NUMBER_ID, false);
  },
  get WHATSAPP_BUSINESS_ACCOUNT_ID() {
    return getEnv(ENV_KEYS.WHATSAPP_BUSINESS_ACCOUNT_ID, false);
  },
  get WHATSAPP_WEBHOOK_TOKEN() {
    return getEnv(ENV_KEYS.WHATSAPP_WEBHOOK_TOKEN, false);
  },
  // SMS
  get LOCAL_SMS_API_KEY() {
    return getEnv(ENV_KEYS.LOCAL_SMS_API_KEY, false);
  },
  get LOCAL_SMS_SENDER_ID() {
    return getEnv(ENV_KEYS.LOCAL_SMS_SENDER_ID, false);
  },
  get GLOBAL_SMS_SENDER_ID() {
    return getEnv(ENV_KEYS.GLOBAL_SMS_SENDER_ID, false);
  },
  get GLOBAL_SMS_API_KEY() {
    return getEnv(ENV_KEYS.GLOBAL_SMS_API_KEY, false);
  },
};

/**
 * Cloud Storage Configuration
 */
export const s3Config: IS3Config = {
  get REGION() {
    return getEnv(ENV_KEYS.CLOUDFLARE_REGION);
  },
  get ACCESS_KEY_ID() {
    return getEnv(ENV_KEYS.CLOUDFLARE_ACCESS_KEY);
  },
  get SECRET_ACCESS_KEY() {
    return getEnv(ENV_KEYS.CLOUDFLARE_SECRET_KEY);
  },
  get BUCKET_NAME() {
    return getEnv(ENV_KEYS.CLOUDFLARE_BUCKET_NAME);
  },
  get ENDPOINT_URL() {
    return getEnv(ENV_KEYS.CLOUDFLARE_ENDPOINT_URL);
  },
  get PUBLIC_URL() {
    return getEnv(ENV_KEYS.CLOUDFLARE_PUBLIC_MEDIA_URL);
  },
};

/**
 * Unified dispatch tokens for full-stack context.
 */
export const codeDispatchTokens: ICodeDispatchTokens = {
  ...emailDispatchTokens,
  ...phoneDispatchTokens,
};

export const authenticate: RequestHandler = verifyAuthTokens(authTokens);
export const optionallyAuthenticate: RequestHandler =
  verifyAuthOptionally(authTokens);

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
export const GATEWAY_URL = env.GATEWAY_URL;
export const FRONTEND_URL = env.FRONTEND_URL;
