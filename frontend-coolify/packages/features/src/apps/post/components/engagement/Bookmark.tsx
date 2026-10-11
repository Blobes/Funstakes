"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { Bookmark } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { BaseStyleObj } from "@repo/core";

export interface BookmarkProps {
  bookmarked: boolean;
  onClick: () => void;
  size?: number;
  style?: BaseStyleObj;
}

export const BookmarkButton = ({
  bookmarked,
  onClick,
  size = 24,
  style,
}: BookmarkProps) => {
  const theme = useTheme();

  return (
    <IconButton
      onClick={onClick}
      sx={{
        padding: 0,
        borderRadius: 0,
        transition: "transform 0.3s ease-in-out",
        "&:hover": {
          transform: "scale(1.08)",
          background: "none",
        },
        ...style,
      }}
    >
      <Bookmark
        size={size}
        style={{
          fill: bookmarked ? theme.palette.primary.main : "none",
          stroke: bookmarked
            ? theme.palette.primary.main
            : theme.palette.gray[200],
        }}
      />
    </IconButton>
  );
};
