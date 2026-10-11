import {
  ENV_KEYS,
  getEnv,
  ICodeDispatchTokens,
  IEmailDispatchTokens,
  IPhoneDispatchTokens,
  IS3Config,
  loadEnv,
} from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv(true);
}

/**
 * Core Worker Service Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv(ENV_KEYS.NODE_ENV);
  },
  get MONGO_URI() {
    return getEnv(ENV_KEYS.MONGO_URI);
  },
  get PORT() {
    return parseInt(getEnv(ENV_KEYS.WORKER_PORT, false) || "8083", 10);
  },
  get SERVICE_URL() {
    return getEnv(ENV_KEYS.WORKER_URL);
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv(ENV_KEYS.FUNSTAKES_REDIS_URL);
  },
};

/**
 * Configuration for email providers including Resend, OAuth2 (Gmail), and standard SMTP relays.
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
 * Configuration for Meta WhatsApp Business API integration.
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
};

/**
 * Unified dispatch tokens for full-stack context.
 */
export const codeDispatchTokens: ICodeDispatchTokens = {
  ...emailDispatchTokens,
  ...phoneDispatchTokens,
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

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const SERVICE_URL = env.SERVICE_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
