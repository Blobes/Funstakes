"use client";

import { useQueryClient, QueryKey, useMutation } from "@tanstack/react-query";
import { useRef, useEffect, useCallback } from "react";
import { CACHE_KEYS, PostType } from "@repo/core";
import { useIntersectionObserver } from "@repo/shared-hooks";
import { PostService } from "../postService";
import { updateCacheItem } from "@repo/helpers";

const MAX_PERSISTED_POSTS = 200;

const enforcePersistCap = (queryClient: ReturnType<typeof useQueryClient>) => {
  const seenEntries = queryClient
    .getQueryCache()
    .findAll({ queryKey: [CACHE_KEYS.POST.SEEN] })
    .map((q) => ({
      postId: q.queryKey[1] as string,
      seenAt: new Date(q.state.data as Date).getTime(),
    }))
    .sort((a, b) => a.seenAt - b.seenAt); // oldest first

  const excess = seenEntries.length - MAX_PERSISTED_POSTS;
  if (excess <= 0) return;

  seenEntries.slice(0, excess).forEach(({ postId }) => {
    queryClient.removeQueries({
      queryKey: [CACHE_KEYS.POST.SEEN, postId],
      exact: true,
    });
    queryClient.removeQueries({
      queryKey: [CACHE_KEYS.POST.GISTS, postId],
      exact: true,
    });
    queryClient.removeQueries({
      queryKey: [CACHE_KEYS.POST.STAKES, postId],
      exact: true,
    });
  });
};

/**
 * Marks a post as viewed after a deliberate dwell time and updates multiple cache keys.
 * @param postId - The ID of the post.
 * @param postType - GIST or STAKE.
 * @param affectedQueryKeys - Array of QueryKeys that should reflect the updated viewCount.
 */
export const usePostSeen = (
  postId: string,
  postType: PostType,
  affectedQueryKeys: QueryKey[] = [[CACHE_KEYS.POST.FEED]],
) => {
  const queryClient = useQueryClient();
  const { markAsSeen } = PostService();
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasBeenSeen = !!queryClient.getQueryData([
    CACHE_KEYS.POST.SEEN,
    postId,
  ]);

  const { mutate } = useMutation({
    mutationFn: async () => {
      // Prevent further triggers in this session immediately
      queryClient.setQueryData([CACHE_KEYS.POST.SEEN, postId], new Date());
      enforcePersistCap(queryClient);
      return await markAsSeen(postId, postType);
    },
    onSuccess: (response) => {
      if (response?.payload?.viewCount) {
        const newCount = response.payload.viewCount;

        // Iterate through all affected keys (Feed, Gists, Stakes, Profile, etc.) and update the viewCount in each.
        affectedQueryKeys.forEach((key) => {
          updateCacheItem(queryClient, key, postId, (oldPost: any) => ({
            ...oldPost,
            viewCount: newCount,
          }));
        });
      }
    },
    onError: (error) => {
      console.error(`[usePostSeen] Sync failed for ${postId}:`, error);
      // Evict block trace from query memory on validation failure to allow future evaluation attempts
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.POST.SEEN, postId],
      });
    },
  });

  // Cleanup timer on unmount.
  useEffect(() => {
    return () => {
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, []);

  const handleIntersect = useCallback(() => {
    if (viewTimerRef.current || hasBeenSeen) return;

    // Trigger update after 30 seconds of continuous visibility
    viewTimerRef.current = setTimeout(() => {
      mutate();
    }, 30000);
  }, [hasBeenSeen, mutate]);

  const handleLeave = useCallback(() => {
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
  }, []);

  const { elementRef } = useIntersectionObserver({
    onIntersect: handleIntersect,
    onLeave: handleLeave,
    threshold: 0.5,
    enabled: !hasBeenSeen,
    once: true,
  });

  return { elementRef };
};
