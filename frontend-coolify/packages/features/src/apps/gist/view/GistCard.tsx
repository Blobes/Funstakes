"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  useAdaptiveTime,
  useSnackbar,
  useMisc,
  useStaticTranslation,
} from "@repo/shared-hooks";
import {
  UIMode,
  IGist,
  MediaProps,
  GenericStyle,
  CACHE_KEYS,
  POST_FEEDBACK,
  useGlobalStore,
  useGistStore,
} from "@repo/core";
import { mediaData } from "@repo/assets";
import { DisplayFeedbackUI, TransText } from "@repo/shared-ui";
import { GistService } from "../gistService";
import { GistMedia } from "./GistMedia";
import { PostHeader } from "../../post/components/header/PostHeader";
import { Metrics } from "../../post/components/Metrics";
import { PostEngagement } from "../../post/components/engagement/Engagement";
import { usePostLike as useGistLike } from "../../post/hooks/like/usePostLike";
import { usePostSeen } from "../../post/hooks/usePostSeen";
import { DynamicCaption } from "../../post/components/Caption";
import { PostService } from "../../post/postService";

interface GistProps {
  gist: IGist;
  style?: GenericStyle;
  mode?: UIMode;
}

export const GistCard = ({ gist, style = {}, mode = "ONLINE" }: GistProps) => {
  const theme = useTheme();
  const { setSBMessage } = useSnackbar();
  const { fetchGistLike, getPendingLike, setPendingLike, clearPendingLike } =
    GistService();
  const { translateText } = PostService();
  const { translateTxtString } = useStaticTranslation();

  const authStatus = useGlobalStore((state) => state.authStatus);
  const setModalContent = useGlobalStore((state) => state.setModalContent);
  const { isOffline, isUnstableNetwork } = useMisc();
  const updateGistLike = useGistStore((state) => state.updateGistLike);

  /**
   * Only like-related state is owned by the like hook.
   * Everything else continues to come from the original gist object.
   */
  const { likedByMe, likeCount, isLiking, handleLike, canInteract } =
    useGistLike(
      {
        _id: gist._id,
        likedByMe: gist.likedByMe,
        likeCount: gist.likeCount,
        status: gist.status,
      },
      fetchGistLike,
      {
        getPendingLike,
        setPendingLike,
        clearPendingLike,
        authStatus,
        setModalContent,
        isOffline,
        isUnstableNetwork,
        setSBMessage,
        mode,
        LoginPrompt: (
          <TransText tKey={POST_FEEDBACK.login_engage_tagline.tKey}>
            {POST_FEEDBACK.login_engage_tagline.tValue}
          </TransText>
        ),
        updateStore: updateGistLike,
        queryKey: [[CACHE_KEYS.POST.GISTS], [CACHE_KEYS.POST.FEED]],
      },
    );

  const gistData: IGist = {
    ...gist,
    likedByMe,
    likeCount,
  };
  const { latestCaption, media, author, createdAt, viewCount, commentCount } =
    gistData;

  const { elementRef } = usePostSeen({ ...gist, postType: "GIST" }, [
    [CACHE_KEYS.POST.FEED],
    [CACHE_KEYS.POST.GISTS],
  ]);

  const gistMedia: MediaProps[] = media && media.length > 0 ? media : mediaData;

  if (gistData.status === "DELETED") {
    return (
      <DisplayFeedbackUI
        type="UNKNOWN"
        tagline={translateTxtString(POST_FEEDBACK.post_deleted_tagline)}
      />
    );
  }

  // Dynamic metrics updated from gistData
  const postMetrics = [
    { label: "Like", count: likeCount, plural: "Likes" },
    { label: "Reply", count: commentCount || 1500, plural: "Replies" },
    { label: "View", count: viewCount || 20000, plural: "Views" },
  ];

  return (
    <Stack
      ref={elementRef as React.RefObject<HTMLDivElement>}
      sx={{
        gap: 0,
        flexGrow: "0",
        flexShrink: "0",
        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
        ...style,
      }}
    >
      <PostHeader
        authorProps={{
          author,
          avatarSize: "36px",
        }}
        actionProps={{
          createdAt,
          useActions: { useAdaptiveTime: () => useAdaptiveTime },
          onMore: () => console.log("Open Menu"),
        }}
      />

      <DynamicCaption
        captionId={latestCaption.captionId}
        caption={latestCaption.caption}
        detectedLanguage={latestCaption.detectedLanguage}
        transServiceFn={{ translateServiceFn: translateText }}
      />
      {/* <WordTrimmer
        text={latestCaption.caption}
        style={{
          container: {
            padding: theme.boxSpacing(4, 0),
            [theme.breakpoints.down("md")]: {
              padding: theme.boxSpacing(4, 6),
            },
          },
        }}
      /> */}

      <GistMedia
        gist={gistData}
        mediaList={gistMedia}
        mode={mode}
        likeState={{
          likedByMe,
          likeCount,
          isLiking,
          handleLike,
          canInteract,
        }}
      />

      <Metrics
        metrics={postMetrics}
        sx={{
          borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
        }}
      />

      <PostEngagement
        like={{ likedByMe, isLiking, handleLike, mode, count: likeCount }}
        reply={{ onClick: () => console.log("Reply clicked") }}
        share={{ onClick: () => console.log("Share clicked") }}
        bookmark={{
          bookmarked: false,
          onClick: () => console.log("Bookmark toggled"),
        }}
        follow={{
          onClick: () => console.log("Follow clicked"),
        }}
      />
    </Stack>
  );
};
