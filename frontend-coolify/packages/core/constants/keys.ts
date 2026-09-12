"use client";

import { PostType } from "../types/payloads/post";
import { KeyType } from "../types/ui-props";

export const QUERY_KEYS = {
  TOTP_CONFIG: (identifier?: string, userId?: string) => [
    "totp_setup_config",
    identifier,
    userId,
  ],
  SECURITY_QUESTIONS_CONFIG: (identifier?: string) => [
    "security_questions",
    identifier,
  ],
} as const;

export const STORAGE_KEYS = {
  [KeyType.POST]: {
    LIKE: "post_like",
    PENDING_LIKES: "pending_post_likes",
    POST_BOOKMARK: "pending_bookmarks",
    DRAFT: (postId: string, type: PostType) => [
      "draft",
      type.toLowerCase(),
      postId,
    ],
  },
  [KeyType.USER]: {
    USER_FOLLOW: "pending_follows",
  },
  MEDIA_UPLOAD: "media-upload-progress",
  MEDIA_COMPRESSION: "media-compression-progress",

  TRANSIT_DATA: ["transit_data"],
  AUTH_TRANSIT: ["transit_data", "auth"],
  PASS_RESET_INIT_TRANSIT: ["transit_data", "password_reset_init"],
  PASS_RESET_FINALIZED_TRANSIT: ["transit_data", "password_reset_finalized"],
  ONBOARDING_TRANSIT: ["transit_data", "onboarding"],
  ACCOUNT_UPDATE_TRANSIT: ["transit_data", "account_update"],
  MFA_UPDATE_TRANSIT: ["transit_data", "mfa_update"],

  TEMPORARY_SESSION_KEY: "temp_session_expiry",
  SESSION_TRANSIT_KEY: "session_transit_key",
} as const;

export const CACHE_KEYS = {
  [KeyType.POST]: {
    GISTS: "gists",
    STAKES: "stakes",
    FEED: "gists",
    SEEN: "seen",
    LOOKUP_TOPICS: "lookup_topics",
    TRANSLATION: "post_translation",
  },
  [KeyType.USER]: {
    SESSION: "auth_sessions",
    TARGET: "user",
    FOLLOWERS: "followers",
  },
  OFFLINE_CACHE: "offline_cache",
  CACHE_PAGE: "cache_page",
} as const;

export const TEMP_STORAGE_KEYS: readonly (readonly string[])[] = [
  STORAGE_KEYS.AUTH_TRANSIT,
  STORAGE_KEYS.ACCOUNT_UPDATE_TRANSIT,
  STORAGE_KEYS.MFA_UPDATE_TRANSIT,
  STORAGE_KEYS.PASS_RESET_INIT_TRANSIT,
  STORAGE_KEYS.PASS_RESET_FINALIZED_TRANSIT,
  STORAGE_KEYS.ONBOARDING_TRANSIT,
];
