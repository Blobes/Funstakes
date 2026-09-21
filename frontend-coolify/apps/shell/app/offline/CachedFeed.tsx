"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { delay, autoScroll } from "@repo/helpers";
import {
  PostSkeleton,
  BoxSkeleton,
  TransText,
  DisplayFeedbackUI,
} from "@repo/shared-ui";
import { CircleSlash2 } from "lucide-react";
import {
  useCachedData,
  usePage,
  useStaticTranslation,
} from "@repo/shared-hooks";
import {
  CLIENT_ROUTES,
  IPost,
  CACHE_KEYS,
  POST_FEEDBACK,
  COMMON_BUTTON_LABELS,
} from "@repo/core";
import { GistCard, StakeCard } from "@repo/features";

export const CachedFeed = () => {
  const theme = useTheme();
  const { navigateTo } = usePage();
  const [isLoading, setIsLoading] = useState(true);
  const { translateTxtString } = useStaticTranslation();

  // Pulling the reactive data from cache.
  const feed = useCachedData<IPost>([
    [CACHE_KEYS.POST.GISTS],
    [CACHE_KEYS.POST.STAKES],
  ]);

  // Artificial delay to ensure skeletons are visible and transitions are smooth.
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await delay();
      setIsLoading(false);
    };
    init();
  }, []);

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
    <Stack sx={{ ...containerStyle }}>
      {isLoading ? (
        <>
          <PostSkeleton />
          <BoxSkeleton />
        </>
      ) : feed.length < 1 ? (
        <DisplayFeedbackUI
          type="UNKNOWN"
          headline={translateTxtString(
            POST_FEEDBACK.offline_feed_empty_headline,
          )}
          tagline={translateTxtString(POST_FEEDBACK.offline_feed_empty_tagline)}
          icon={<CircleSlash2 />}
          primaryCta={{
            type: "BUTTON",
            variant: "outlined",
            label: translateTxtString(COMMON_BUTTON_LABELS.explore_funstakes),
            action: () => navigateTo(CLIENT_ROUTES.about),
          }}
        />
      ) : (
        feed.map((post) => {
          switch (post.postType) {
            case "GIST":
              return <GistCard key={post._id} gist={post} mode="OFFLINE" />;
            case "STAKE":
              return <StakeCard key={post._id} stake={post} />;
            default:
              <TransText tKey={POST_FEEDBACK.post_type_not_found.tKey}>
                {POST_FEEDBACK.post_type_not_found.tValue}
              </TransText>;
          }
        })
      )}
    </Stack>
  );
};
