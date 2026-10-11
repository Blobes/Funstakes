import type { RequestHandler } from "express";
import {
  ENV_KEYS,
  getEnv,
  IAuthConfig,
  IS3Config,
  loadEnv,
} from "@repo/shared";
import { verifyAuthOptionally, verifyAuthTokens } from "@repo/security";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}
/**
 * Core Post Service Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv(ENV_KEYS.NODE_ENV);
  },
  get MONGO_URI() {
    return getEnv(ENV_KEYS.MONGO_URI);
  },
  get PORT() {
    return parseInt(getEnv(ENV_KEYS.POST_PORT, false) || "8081", 10);
  },
  get SERVICE_URL() {
    return getEnv(ENV_KEYS.POST_URL);
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv(ENV_KEYS.FUNSTAKES_REDIS_URL);
  },
};

// Authentication Configuration
export const authConfig: IAuthConfig = {
  get ACCESS_TOKEN_SECRET() {
    return getEnv(ENV_KEYS.JWT_SECRET);
  },
  get REFRESH_TOKEN_SECRET() {
    return getEnv(ENV_KEYS.REFRESH_TOKEN_SECRET);
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
 * Middleware instances for strict authentication
 */
export const authenticate: RequestHandler = verifyAuthTokens(authConfig);

/**
 * Middleware instances for optional authentication
 */
export const optionallyAuthenticate: RequestHandler =
  verifyAuthOptionally(authConfig);

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const SERVICE_URL = env.SERVICE_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
