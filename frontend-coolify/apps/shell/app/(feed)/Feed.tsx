"use client";

import React, { useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { UpdatesCarousel } from "./vibezSlider/Slider";
import {
  PostSkeleton,
  ProgressUI,
  BoxSkeleton,
  TransText,
  DisplayFeedbackUI,
} from "@repo/shared-ui";
import { Milestone } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { GistCard, StakeCard, useFeed } from "@repo/features";
import { autoScroll } from "@repo/helpers";
import {
  useCachedData,
  useInfiniteScroll,
  useLoadingFallback,
  useStaticTranslation,
} from "@repo/shared-hooks";
import {
  IPost,
  CACHE_KEYS,
  COMMON_BUTTON_LABELS,
  POST_FEEDBACK,
} from "@repo/core";

export const Feed = () => {
  const theme = useTheme();
  const {
    feed: onlinePosts,
    message,
    isLoading,
    handleRefresh,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFeed();
  const canFallbackToCache = useLoadingFallback(isLoading);

  const cachedPosts = useCachedData<IPost>([
    [CACHE_KEYS.POST.GISTS],
    [CACHE_KEYS.POST.STAKES],
  ]);

  const { translateTxtString } = useStaticTranslation();
  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const feed =
    onlinePosts.length > 0
      ? onlinePosts
      : canFallbackToCache
        ? cachedPosts || []
        : [];

  const showSkeleton = isLoading && feed.length === 0;

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: "400px",
      gap: theme.gap(8),
      padding: theme.boxSpacing(8, 24),
      ...(feed.length > 1 && autoScroll().base),
      [theme.breakpoints.down("md")]: {
        maxWidth: "unset",
        minWidth: "unset",
        padding: theme.boxSpacing(0),
        ...(!isLoading && autoScroll().mobile),
      },
    }),
    [theme, feed.length, isLoading, autoScroll],
  );

  return (
    <Stack sx={containerStyle}>
      <UpdatesCarousel />

      {showSkeleton ? (
        <>
          <PostSkeleton />
          <BoxSkeleton />
        </>
      ) : feed.length < 1 ? (
        <DisplayFeedbackUI
          type="UNKNOWN"
          tagline={
            message || translateTxtString(POST_FEEDBACK.no_post_found_tagline())
          }
          icon={<Milestone />}
          primaryCta={{
            type: "BUTTON",
            variant: "outlined",
            label: translateTxtString(COMMON_BUTTON_LABELS.refresh),
            action: () => {
              handleRefresh();
            },
          }}
        />
      ) : (
        <>
          {feed.map((post) => {
            switch (post.postType) {
              case "GIST":
                return <GistCard key={post._id} gist={post} mode="ONLINE" />;

              case "STAKE":
                return <StakeCard key={post._id} stake={post} />;

              default:
                <TransText tKey={POST_FEEDBACK.post_type_not_found.tKey}>
                  {POST_FEEDBACK.post_type_not_found.tValue}
                </TransText>;
            }
          })}
          {/* Pagination Sentinel */}
          {hasNextPage && (
            <Box
              ref={sentinelRef}
              sx={{
                padding: theme.gap(4),
                display: "flex",
                justifyContent: "center",
                minHeight: "40px",
              }}
            >
              {isFetchingNextPage && <ProgressUI options={{ size: 24 }} />}
            </Box>
          )}
        </>
      )}
    </Stack>
  );
};
