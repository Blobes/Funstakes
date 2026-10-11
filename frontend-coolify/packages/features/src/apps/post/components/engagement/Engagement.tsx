"use client";

import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LikeButton, LikeProps } from "./Like";
import { BookmarkButton, BookmarkProps } from "./Bookmark";
import { ShareButton, ShareProps } from "./Share";
import { ReplyButton, ReplyProps } from "./Reply";
import { summarizeNum } from "@repo/helpers";
import { BaseStyleObj } from "@repo/core";
import { FollowButton, FollowProps } from "./Follow";
import { TransText } from "@repo/shared-ui";

interface Hide {
  like?: boolean;
  share?: boolean;
  reply?: boolean;
  bookmark?: boolean;
  follow?: boolean;
}

export interface EngagementProps {
  like: LikeProps & { count?: number };
  reply: ReplyProps & { count?: number };
  bookmark: BookmarkProps & { count?: number };
  share: ShareProps & { count?: number };
  follow?: FollowProps;
  hide?: Hide;
  addition?: React.ReactNode;
  variant?: "HORIZONTAL" | "VERTICAL";
  style?: BaseStyleObj;
}

export const PostEngagement = ({
  like,
  reply,
  bookmark,
  share,
  follow,
  hide = {},
  addition,
  variant = "HORIZONTAL",
  style,
}: EngagementProps) => {
  const theme = useTheme();
  const isVertical = variant === "VERTICAL";

  // Helper to conditionally render metrics based on variant
  const renderAction = (ButtonComponent: React.ReactNode, count?: number) => (
    <Stack alignItems="center" spacing={0.5}>
      {ButtonComponent}
      {isVertical && count !== undefined && (
        <TransText
          sx={{
            ...theme.typography.text5,
            fontWeight: 700,
            color: theme.palette.gray[200],
            textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {summarizeNum(count)}
        </TransText>
      )}
    </Stack>
  );

  return (
    <Stack
      direction={isVertical ? "column" : "row"}
      justifyContent={isVertical ? "center" : "space-between"}
      alignItems="center"
      sx={{
        width: isVertical ? "auto" : "100%",
        padding: isVertical ? theme.boxSpacing(2) : theme.boxSpacing(6, 0),
        [theme.breakpoints.down("md")]: {
          padding: isVertical ? theme.boxSpacing(2) : theme.boxSpacing(4, 6),
        },
        ...style,
      }}
    >
      {/* Main Action Group */}
      <Stack
        sx={{
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? theme.gap(4) : theme.gap(6),
          alignItems: "center",
        }}
      >
        {!hide.like &&
          renderAction(
            <LikeButton
              likedByMe={like.likedByMe}
              isLiking={like.isLiking}
              handleLike={like.handleLike}
              mode={like.mode}
            />,
            like.count,
          )}

        {!hide.reply &&
          renderAction(
            <ReplyButton onClick={reply.onClick} size={reply.size} />,
            reply.count,
          )}

        {!hide.share &&
          renderAction(
            <ShareButton onClick={share.onClick} size={share.size} />,
            share.count,
          )}

        {/* In Vertical variant, Bookmark and Follow Icon lives inside the main stack */}
        {isVertical &&
          !hide.bookmark &&
          renderAction(
            <BookmarkButton
              bookmarked={bookmark.bookmarked}
              onClick={bookmark.onClick}
              size={bookmark.size}
            />,
            bookmark.count,
          )}
      </Stack>

      {addition && addition}

      {/* In Horizontal variant, Bookmark is pushed to the far right */}

      <Stack direction="row">
        {!isVertical &&
          !hide.follow &&
          follow &&
          renderAction(
            <FollowButton onClick={follow.onClick} size={follow.size} />,
          )}
        {!isVertical && !hide.bookmark && (
          <BookmarkButton
            bookmarked={bookmark.bookmarked}
            onClick={bookmark.onClick}
            size={bookmark.size}
          />
        )}
      </Stack>
    </Stack>
  );
};
