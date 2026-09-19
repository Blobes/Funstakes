"use client";

import { useMemo } from "react";
import { asset } from "@repo/assets";
import { CACHE_KEYS, IPost, IGistPayload } from "@repo/core";
import { useFeed } from "@repo/features";
import { useCachedData, usePageCache } from "@repo/shared-hooks";

/**
 * Filter and compute the top trending posts based on engagement heuristics.
 */
export const useTrendingData = () => {
  const { feed: onlinePosts, isLoading, rawData } = useFeed();
  const cachedPosts = useCachedData<IPost>([
    [CACHE_KEYS.POST.GISTS],
    [CACHE_KEYS.POST.STAKES],
  ]);

  // usePageCache(rawData, CACHE_KEYS.POST.FEED);
  const posts = onlinePosts.length > 0 ? onlinePosts : cachedPosts;

  const avatars = [
    asset.avatar1,
    asset.avatar2,
    asset.avatar3,
    asset.avatar4,
    asset.avatar5,
    asset.avatar6,
  ];

  const gradLocation = "60%";
  const gradDegree = "180deg";
  const bgColors = [
    `linear-gradient(${gradDegree},rgb(29, 45, 150) 0%,rgb(16, 26, 84) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(18, 89, 112) 0%,rgb(9, 62, 67) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(21, 124, 57) 0%,rgb(11, 68, 45) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(102, 107, 20) 0%,rgb(58, 68, 11) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(113, 61, 27) 0%,rgb(61, 35, 9) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(112, 26, 114) 0%,rgb(68, 9, 61) ${gradLocation})`,
  ];

  const processedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    // Calculate engagement weights for filtering
    const scoredPosts = posts.map((post) => {
      let score = 0;
      let caption = "";

      if (post.postType === "GIST") {
        const payload = post as unknown as IGistPayload;
        score =
          (payload.likeCount || 0) +
          (payload.viewCount || 0) +
          (payload.commentCount || 0);
        caption = payload.latestCaption?.caption || "";
      } else {
        // Fallback weighting structure for Stake payloads
        score = 0;
        caption = post.content || "";
      }

      return { post, score, caption };
    });

    // Sort descending and pluck top 6 items
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item, index) => ({
        post: item.post,
        caption: item.caption,
        avatar: avatars[index % avatars.length],
        bgColor: bgColors[index % bgColors.length],
      }));
  }, [posts]);

  return { processedPosts, isLoading };
};
