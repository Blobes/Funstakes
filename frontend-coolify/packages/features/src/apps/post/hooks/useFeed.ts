"use client";

import { IPost, IStake, CACHE_KEYS, IListPayload, ApiError } from "@repo/core";
import { PostService } from "../postService";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useStake } from "../../stake/useStake";

type FeedPage = IListPayload<IPost> & { next: number | undefined };

/**
 * Manages the unified feed and dissolves bulk results into granular cache entries.
 */
export const useFeed = () => {
  const queryClient = useQueryClient();
  const { stakes } = useStake();
  const { fetchFeed } = PostService();

  const {
    data,
    error,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FeedPage, ApiError>({
    queryKey: [CACHE_KEYS.POST.FEED],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetchFeed(pageParam as number, 20);
      const remotePayload = res.payload || [];

      // Dissolve Strategy: Push each post into its own granular key.
      // This allows individual post updates to sync across the whole app.
      remotePayload.forEach((post: IPost) => {
        const baseKey =
          post.postType === "STAKE"
            ? CACHE_KEYS.POST.STAKES
            : CACHE_KEYS.POST.GISTS;

        queryClient.setQueryData([baseKey, post._id], post);
      });

      return {
        ...res,
        payload: remotePayload,
        next: res.metaData?.hasNextPage ? (pageParam as number) + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  //  Combines remote paginated feed and local stakes into a single unified list.
  const remotePosts = data?.pages.flatMap((page) => page.payload || []) || [];

  const feed = [
    ...remotePosts.map((post) => ({
      ...post,
      postType: post.postType || "GIST",
    })),
    ...stakes.map((stake: IStake) => ({
      ...stake,
      postType: "STAKE" as const,
    })),
  ] as IPost[];

  return {
    feed,
    rawData: data,
    message: error ? error.localizedErrMsg || error.message : null,
    isLoading,
    handleRefresh: refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
