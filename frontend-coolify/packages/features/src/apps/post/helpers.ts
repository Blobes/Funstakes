"use client";

import { QueryClient } from "@tanstack/react-query";
import { getEntityFromCache } from "@repo/helpers";
import { CACHE_KEYS, IPost } from "@repo/core";

export const getPostFromCache = (
  queryClient: QueryClient,
  postId: string,
): IPost | undefined =>
  getEntityFromCache<IPost>({
    queryClient,
    entityId: postId,
    granularKeys: [
      [CACHE_KEYS.POST.GISTS, postId],
      [CACHE_KEYS.POST.STAKES, postId],
    ],
    listKeys: [[CACHE_KEYS.POST.FEED]],
    extractList: (data) =>
      (data as { pages?: Array<{ payload?: IPost[] }> })?.pages?.flatMap(
        (p) => p.payload || [],
      ),
  });
