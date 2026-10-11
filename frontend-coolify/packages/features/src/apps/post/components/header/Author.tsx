"use client";

import React from "react";
import { Stack } from "@mui/material";
import { BaseStyleObj, IPostAuthor } from "@repo/core";
import { useTheme } from "@mui/material/styles";
import { TransText, UserAvatar } from "@repo/shared-ui";

export interface AuthorProps {
  author: IPostAuthor;
  avatarSize?: string;
  showUsername?: boolean;
  style?: BaseStyleObj;
}

export const AuthorInfo = ({
  author,
  avatarSize = "32px",
  showUsername = true,
  style,
}: AuthorProps) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", width: "100%", gap: theme.gap(2), ...style }}
    >
      <UserAvatar
        userInfo={{
          _id: author._id,
          displayName: author.displayName,
          profileImage: author.profileImage,
        }}
        style={{ width: avatarSize, height: avatarSize }}
        aria-label={author.displayName}
      />
      <Stack sx={{ width: "100%", gap: theme.gap(0), minWidth: "40px" }}>
        <TransText
          noWrap
          sx={{ ...theme.typography.text3, fontWeight: "bold" }}
        >
          {author.displayName}
        </TransText>
        {showUsername && (
          <TransText
            noWrap
            sx={{
              ...theme.typography.text4,
              color: theme.palette.gray[200],
              lineHeight: "1.1em",
            }}
          >
            @{author.username}
          </TransText>
        )}
      </Stack>
    </Stack>
  );
};
