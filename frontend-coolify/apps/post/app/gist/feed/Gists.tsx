"use client";

import React, { useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { DisplayFeedbackUI, PostSkeleton, ProgressUI } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { autoScroll } from "@repo/helpers";
import { GistCard, useGists } from "@repo/features";
import {
  useCachedData,
  useInfiniteScroll,
  useLoadingFallback,
  useStaticTranslation,
} from "@repo/shared-hooks";
import {
  IGist,
  CACHE_KEYS,
  POST_FEEDBACK,
  COMMON_BUTTON_LABELS,
} from "@repo/core";
import { CreateGist } from "../create/CreateGist";

/**
 * Main Gists feed component.
 */
export const Gists = () => {
  const theme = useTheme();
  const {
    gists: onlineGists,
    message,
    isLoading,
    handleRefresh,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGists();

  const { translateTxtString } = useStaticTranslation();
  const cachedGists = useCachedData<IGist>([CACHE_KEYS.POST.GISTS]);
  const canFallbackToCache = useLoadingFallback(isLoading);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Live data wins once it exists. While still loading, only use cache
  // once the delay grace period has elapsed.
  const gists =
    onlineGists.length > 0
      ? onlineGists
      : canFallbackToCache
        ? cachedGists || []
        : [];

  const showSkeleton = isLoading && gists.length === 0;

  const finalMsg = POST_FEEDBACK.no_post_found_tagline("gist");

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: "400px",
      gap: theme.gap(8),
      padding: theme.boxSpacing(8, 24),
      ...(gists.length > 1 && autoScroll().base),
      [theme.breakpoints.down("md")]: {
        border: "none",
        maxWidth: "unset",
        minWidth: "unset",
        padding: theme.boxSpacing(0),
        ...(!isLoading && autoScroll().mobile),
      },
    }),
    [theme, gists.length, isLoading],
  );

  return (
    <Stack sx={containerStyle}>
      <CreateGist />

      {showSkeleton ? (
        <PostSkeleton />
      ) : gists.length < 1 ? (
        <DisplayFeedbackUI
          type="UNKNOWN"
          tagline={message || translateTxtString(finalMsg)}
          primaryCta={{
            type: "BUTTON",
            variant: "outlined",
            label: translateTxtString(COMMON_BUTTON_LABELS.explore_funstakes),
            action: () => {
              handleRefresh();
            },
          }}
        />
      ) : (
        <>
          {gists.map((gist) => (
            <GistCard key={gist._id} gist={gist} />
          ))}

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
