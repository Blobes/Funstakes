"use client";

import React, { useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { UpdatesCarousel } from "./vibezSlider/Slider";
import {
  Feedback,
  PostSkeleton,
  ProgressIcon,
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
  usePageCache,
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
    rawData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFeed();

  const cachedPosts = useCachedData<IPost>([
    [CACHE_KEYS.POST.GISTS],
    [CACHE_KEYS.POST.STAKES],
  ]);

  // usePageCache(rawData, CACHE_KEYS.POST.FEED);

  const { translateTxtString } = useStaticTranslation();
  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Determine which data to display. Priority: Online data > Cached data.
  const feed = onlinePosts.length > 0 ? onlinePosts : cachedPosts;

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

      {isLoading ? (
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
              {isFetchingNextPage && <ProgressIcon options={{ size: 24 }} />}
            </Box>
          )}
        </>
      )}
    </Stack>
  );
};
