import type { RequestHandler } from "express";
import {
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
    return getEnv("NODE_ENV");
  },
  get MONGO_URI() {
    return getEnv("MONGO_URI");
  },
  get PORT() {
    return parseInt(getEnv("ACCOUNT_PORT", false) || "8085", 10);
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv("FUNSTAKES_REDIS_URL");
  },
  get GATEWAY_URL() {
    return getEnv("GATEWAY_URL");
  },
  get FRONTEND_URL() {
    return getEnv("FRONTEND_URL");
  },
};

/**
 * Authentication Configuration
 */
export const authTokens: IAuthConfig = {
  get ACCESS_TOKEN_SECRET() {
    return getEnv("JWT_SECRET");
  },
  get REFRESH_TOKEN_SECRET() {
    return getEnv("REFRESH_TOKEN_SECRET");
  },
};

export const oauthId = {
  get GOOGLE_CLIENT_ID() {
    return getEnv("GOOGLE_CLIENT_ID");
  },
  get GOOGLE_CLIENT_SECRET() {
    return getEnv("GOOGLE_CLIENT_SECRET");
  },
  get APPLE_CLIENT_ID() {
    return getEnv("APPLE_CLIENT_ID");
  },
};

/**
 * Email Provider Configuration
 */
export const emailDispatchTokens: IEmailDispatchTokens = {
  get RESEND_API_KEY() {
    return getEnv("RESEND_API_KEY", false);
  },
  get RESEND_FROM_EMAIL() {
    return getEnv("RESEND_FROM", false);
  },
  get SMTP_HOST_EMAIL() {
    return getEnv("SMTP_HOST_EMAIL", false);
  },
  get SMTP_PORT() {
    return getEnv("SMTP_HOST_PORT", false);
  },
  get SMTP_USER() {
    return getEnv("SMTP_USERNAME", false);
  },
  get SMTP_PASSWORD() {
    return getEnv("SMTP_USER_PASSWORD", false);
  },
};

/**
 * Phone and WhatsApp Configuration
 */
export const phoneDispatchTokens: IPhoneDispatchTokens = {
  get WHATSAPP_API_URL() {
    return getEnv("WHATSAPP_API_URL", false);
  },
  get WHATSAPP_ACCESS_KEY() {
    return getEnv("WHATSAPP_ACCESS_KEY", false);
  },
  get WHATSAPP_PHONE_NUMBER_ID() {
    return getEnv("WHATSAPP_PHONE_NUMBER_ID", false);
  },
  get WHATSAPP_BUSINESS_ACCOUNT_ID() {
    return getEnv("WHATSAPP_BUSINESS_ACCOUNT_ID", false);
  },
  // SMS
  get LOCAL_SMS_API_KEY() {
    return getEnv("LOCAL_SMS_API_KEY", false);
  },
  get LOCAL_SMS_SENDER_ID() {
    return getEnv("LOCAL_SMS_SENDER_ID", false);
  },
  get GLOBAL_SMS_SENDER_ID() {
    return getEnv("GLOBAL_SMS_SENDER_ID", false);
  },
  get GLOBAL_SMS_API_KEY() {
    return getEnv("GLOBAL_SMS_API_KEY", false);
  },
};

/**
 * Cloud Storage Configuration
 */
export const s3Config: IS3Config = {
  get REGION() {
    return getEnv("CLOUDFLARE_REGION");
  },
  get ACCESS_KEY_ID() {
    return getEnv("CLOUDFLARE_ACCESS_KEY");
  },
  get SECRET_ACCESS_KEY() {
    return getEnv("CLOUDFLARE_SECRET_KEY");
  },
  get BUCKET_NAME() {
    return getEnv("CLOUDFLARE_BUCKET_NAME");
  },
  get ENDPOINT_URL() {
    return getEnv("CLOUDFLARE_ENDPOINT_URL");
  },
  get PUBLIC_URL() {
    return getEnv("CLOUDFLARE_PUBLIC_MEDIA_URL");
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
