import { ENV_KEYS, getEnv, loadEnv } from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

/**
 * Core Gateway Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv(ENV_KEYS.NODE_ENV);
  },
  get MONGO_URI() {
    return getEnv(ENV_KEYS.MONGO_URI);
  },
  get PORT() {
    return parseInt(getEnv(ENV_KEYS.GATEWAY_PORT, false) || "8000", 10);
  },
  get GATEWAY_URL() {
    return getEnv(ENV_KEYS.GATEWAY_URL);
  },
  get ACCOUNT_URL() {
    return getEnv(ENV_KEYS.ACCOUNT_URL);
  },
  get POST_URL() {
    return getEnv(ENV_KEYS.POST_URL);
  },
  get PLATFORM_URL() {
    return getEnv(ENV_KEYS.PLATFORM_URL);
  },
  get WORKER_URL() {
    return getEnv(ENV_KEYS.WORKER_URL);
  },

  get JWT_SECRET() {
    return getEnv(ENV_KEYS.JWT_SECRET);
  },

  get FUNSTAKES_REDIS_URL() {
    return getEnv(ENV_KEYS.FUNSTAKES_REDIS_URL);
  },
};

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const GATEWAY_URL = env.GATEWAY_URL;
export const ACCOUNT_URL = env.ACCOUNT_URL;
export const POST_URL = env.POST_URL;
export const PLATFORM_URL = env.PLATFORM_URL;
export const WORKER_URL = env.WORKER_URL;
export const JWT_SECRET = env.JWT_SECRET;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
