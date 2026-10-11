import mongoose from "mongoose";
import { FollowModel, GistModel, PostContentStatus } from "@repo/database";
import {
  getStaticPostList,
  getPostSocialData,
  getUserPreferences,
  MESSAGES_REGISTRY,
  TransInfo,
  CACHE_KEYS,
  CACHE_EXPIRY,
  getCacheSortedSet,
  setCacheSortedSet,
  getOrSetCacheSet,
} from "@repo/shared";

export interface GetFollowersPostsInput {
  userId: string;
  page: number;
  limit: number;
}

export interface GetFollowersPostsResult {
  status: "SUCCESS" | "EMPTY_FEED";
  transInfo: TransInfo;
  payload: Record<string, unknown>[];
  meta?: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Orchestrates candidate ZSET caching and dynamic social state hydration for a user followers feed.
 */
export const executeGetFollowersPosts = async (
  input: GetFollowersPostsInput,
): Promise<GetFollowersPostsResult> => {
  const { userId, page, limit } = input;
  const skip = (page - 1) * limit;

  // Resolves cached following IDs list.
  const followingIds = await getOrSetCacheSet(
    CACHE_KEYS.USER_FOLLOWING(userId),
    async () => {
      const docs = await FollowModel.find({
        followerId: new mongoose.Types.ObjectId(String(userId)),
      })
        .select("followingId")
        .lean();
      return docs.map((doc) => String(doc.followingId));
    },
    CACHE_EXPIRY.HOUR_24,
  );

  if (!followingIds || followingIds.length === 0) {
    return {
      status: "EMPTY_FEED",
      transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_EMPTY,
      payload: [],
      meta: {
        totalDocs: 0,
        totalPages: 0,
        currentPage: page,
        limit,
        hasNextPage: false,
      },
    };
  }

  let candidatePosts: Record<string, unknown>[] = [];
  const userFeedCacheKey = CACHE_KEYS.USER_FOLLOWERS_FEED(userId);

  // Attempts to fetch cached post IDs from Redis ZSET candidate index.
  const cachedPostIds = await getCacheSortedSet(
    userFeedCacheKey,
    skip,
    skip + limit - 1,
  );

  if (cachedPostIds.length > 0) {
    const objectIds = cachedPostIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // Hydrates candidate posts while preserving exact score ranking order.
    candidatePosts = await GistModel.aggregate([
      { $match: { _id: { $in: objectIds } } },
      {
        $addFields: {
          __order: { $indexOfArray: [cachedPostIds, { $toString: "$_id" }] },
        },
      },
      { $sort: { __order: 1 } },
    ]);
  }

  // Evaluates database fallback on cache miss and builds fresh candidate ZSET.
  if (candidatePosts.length === 0) {
    const userPrefs = await getUserPreferences(String(userId));

    const matchFilter = {
      authorId: {
        $in: followingIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      status: "PUBLISHED" as PostContentStatus,
      // Apply user blockings & exclusions directly at DB level
      ...(userPrefs.blockedUserIds.length > 0 && {
        authorId: {
          $nin: userPrefs.blockedUserIds.map(
            (id) => new mongoose.Types.ObjectId(id),
          ),
          $in: followingIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      }),
    };

    const fetchLimit = Math.max(100, skip + limit);
    const pipeline = getStaticPostList({
      matchFilter,
      limit: fetchLimit,
      skip: 0,
    });

    const rawCandidates = await GistModel.aggregate(pipeline);

    if (!rawCandidates || rawCandidates.length === 0) {
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_FETCHED_SUCCESSFULLY,
        payload: [],
        meta: {
          totalDocs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
        },
      };
    }

    // Computes timestamp scores for candidates to populate Redis ZSET index.
    const scoredItems = rawCandidates.map((post: Record<string, unknown>) => {
      const createdAt = post.createdAt
        ? new Date(post.createdAt as string | Date).getTime()
        : Date.now();

      return {
        member: String(post._id),
        score: createdAt,
      };
    });

    await setCacheSortedSet(userFeedCacheKey, scoredItems, CACHE_EXPIRY.MIN_20);

    candidatePosts = rawCandidates.slice(skip, skip + limit);
  }

  if (candidatePosts.length === 0) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_FETCHED_SUCCESSFULLY,
      payload: [],
      meta: {
        totalDocs: 0,
        totalPages: 0,
        currentPage: page,
        limit,
        hasNextPage: false,
      },
    };
  }

  /**
   * Hydrates personalized social state indicators across filtered posts.
   */
  const postIds = candidatePosts.map((p) => String(p._id));
  const postObjectIds = postIds.map((id) => new mongoose.Types.ObjectId(id));

  const socialData = await GistModel.aggregate([
    { $match: { _id: { $in: postObjectIds } } },
    {
      $addFields: {
        __order: { $indexOfArray: [postIds, { $toString: "$_id" }] },
      },
    },
    { $sort: { __order: 1 } },
    ...getPostSocialData({ userId: String(userId) }),
  ]);

  const socialMap = new Map<string, Record<string, unknown>>(
    socialData.map((item) => [String(item._id), item]),
  );

  const finalPayload = candidatePosts.map((post) => {
    const postId = String(post._id);
    const social = socialMap.get(postId);
    const author = (post.author as Record<string, unknown>) || {};

    return {
      ...post,
      likedByMe: (social?.likedByMe as boolean) || false,
      author: {
        ...author,
        isFollowing: true,
        followsMe: (social?.followsMe as boolean) || false,
      },
    };
  });

  const totalEstimatedCount = 100;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.FOLLOWERS_FEED_FETCHED_SUCCESSFULLY,
    payload: finalPayload,
    meta: {
      totalDocs: totalEstimatedCount,
      totalPages: Math.ceil(totalEstimatedCount / limit),
      currentPage: page,
      limit,
      hasNextPage: skip + finalPayload.length < totalEstimatedCount,
    },
  };
};
