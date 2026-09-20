import {
  invalidateCache,
  invalidatePattern,
} from "../services/redis/cache/helpers";
import { IAuthRequest, PostType } from "../types/general";
import { CACHE_KEYS } from "./cacheKeys";
import { RoleName } from "@repo/database";

export type InvalidateEvent =
  | "CRITICAL_UPDATE"
  | "USER_SETTINGS"
  | "ACCOUNT_UPDATE"
  | "POST_UPDATE"
  | "SOCIAL_RELATIONSHIP_UPDATE"
  | "BLOCK_LIST_UPDATE"
  | "DEVICE_TRUST_UPDATE"
  | "SESSIONS_REVOKE_ALL";

export interface InvalidatePostOptions {
  postType?: PostType;
  postId?: string;
  userId?: string;
  targetLang?: string;
  invalidatePostTypeFeed?: boolean;
  invalidateGlobalFirstPage?: boolean;
  invalidatePostLanguages?: boolean;
}

export interface InvalidateUserOptions {
  userId: string;
  eventType?: InvalidateEvent;
  deviceToken?: string;
}

/**
 * Handles standardized cache invalidation routines across domain entities.
 */
export const INVALIDATE_CACHE = {
  /**
   * Invalidates topic lookup and taxonomy discovery caches.
   */
  forTopics: async (): Promise<void> => {
    await invalidatePattern(CACHE_KEYS.WILDCARD_TOPICS_LOOKUP);
  },

  /**
   * Invalidates the Redis role-permission mapping cache when roles change.
   */
  forUserRole: async (roleName: RoleName): Promise<void> => {
    await invalidatePattern(CACHE_KEYS.WILDCARD_ROLE_PERMISSIONS(roleName));
  },
  /**
   * Invalidates target user identity, social graph, device, and setting caches safely.
   */
  forUser: async (options: InvalidateUserOptions): Promise<void> => {
    const { userId, deviceToken, eventType } = options;
    switch (eventType) {
      case "CRITICAL_UPDATE":
        await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));
        break;

      case "ACCOUNT_UPDATE":
        await Promise.all([
          invalidateCache(CACHE_KEYS.USER_BASE(userId)),
          invalidateCache(CACHE_KEYS.USER_PROFILE(userId)),
        ]);
        break;

      case "USER_SETTINGS":
        await invalidateCache(CACHE_KEYS.USER_PREFERENCES(userId));
        break;

      case "POST_UPDATE":
        await invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId));
        break;

      case "SOCIAL_RELATIONSHIP_UPDATE":
        await Promise.all([
          invalidateCache(CACHE_KEYS.USER_FOLLOWING(userId)),
          invalidatePattern(CACHE_KEYS.WILDCARD_FOLLOWERS_ALL(userId)),
          invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId)),
        ]);
        break;

      case "BLOCK_LIST_UPDATE":
        await Promise.all([
          invalidateCache(CACHE_KEYS.USER_BLOCKINGS(userId)),
          invalidateCache(CACHE_KEYS.USER_BLOCKERS(userId)),
          invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId)),
        ]);
        break;

      case "DEVICE_TRUST_UPDATE":
        await Promise.all([
          invalidateCache(CACHE_KEYS.USER_PRIMARY_DEVICE(userId)),
          invalidatePattern(CACHE_KEYS.WILDCARD_DEVICES(userId)),
        ]);
        if (deviceToken)
          await invalidateCache(
            CACHE_KEYS.DEVICE_TRUST_STATUS(userId, deviceToken),
          );
        break;

      case "SESSIONS_REVOKE_ALL":
        await invalidatePattern(CACHE_KEYS.WILDCARD_USER_SESSIONS(userId));
        break;
    }
  },

  /**
   * Invalidates post entity data, optional localized translations, author feeds, and global feeds.
   */
  forPost: async (options: InvalidatePostOptions): Promise<void> => {
    const {
      postType,
      postId,
      userId,
      targetLang,
      invalidatePostTypeFeed = false,
      invalidateGlobalFirstPage = false,
      invalidatePostLanguages = true,
    } = options;

    const tasks: Promise<unknown>[] = [];

    if (postId) {
      if (postType)
        tasks.push(invalidateCache(CACHE_KEYS.POST(postType, postId)));

      if (invalidatePostLanguages) {
        if (targetLang)
          tasks.push(
            invalidateCache(CACHE_KEYS.POST_TRANSLATION(postId, targetLang)),
          );
        else
          tasks.push(
            invalidatePattern(CACHE_KEYS.WILDCARD_POST_TRANSLATIONS(postId)),
          );
      }
    }

    if (invalidatePostTypeFeed && postType) {
      tasks.push(
        invalidatePattern(CACHE_KEYS.WILDCARD_POST_FEED_TYPE(postType)),
      );
    }

    if (invalidateGlobalFirstPage) {
      tasks.push(invalidatePattern(CACHE_KEYS.WILDCARD_GLOBAL_FEED_PAGE_ONE));
    }

    if (userId) {
      tasks.push(
        INVALIDATE_CACHE.forUser({ userId, eventType: "POST_UPDATE" }),
      );
    }

    await Promise.all(tasks);
  },

  /**
   * Extracts parameter context from Express Request object to run invalidations inside middleware automatically.
   */
  forPostFromRequest: async (
    req: IAuthRequest,
    params: InvalidatePostOptions,
  ): Promise<void> => {
    const {
      postType: defaultPostType,
      invalidateGlobalFirstPage,
      invalidatePostTypeFeed,
      invalidatePostLanguages,
    } = params;

    const userId =
      (req.user as { id?: string })?.id || (req.body?.userId as string);

    const postId = (req.params?.postId ||
      req.body?.postId ||
      req.query?.postId) as string;

    const postType = (req.params?.postType ||
      req.body?.postType ||
      defaultPostType) as PostType;

    const targetLang = (req.query?.targetLang || req.body?.targetLang) as
      | string
      | undefined;

    await INVALIDATE_CACHE.forPost({
      postType,
      postId,
      userId,
      targetLang,
      invalidatePostTypeFeed,
      invalidateGlobalFirstPage,
      invalidatePostLanguages,
    });
  },

  /**
   * Extracts user context from Express Request object to run user invalidations inside middleware.
   */
  forUserFromRequest: async (
    req: IAuthRequest,
    eventType: InvalidateEvent,
  ): Promise<void> => {
    const userId =
      (req.user as { id?: string })?.id ||
      (req.params?.userId as string) ||
      (req.params?.id as string) ||
      (req.body?.userId as string);

    if (!userId) {
      return;
    }

    await INVALIDATE_CACHE.forUser({ userId, eventType });
  },
};
