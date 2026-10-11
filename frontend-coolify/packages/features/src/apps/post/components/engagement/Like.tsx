"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { Heart } from "lucide-react";
import { pulse } from "@repo/helpers";
import { red } from "@mui/material/colors";
import { useTheme } from "@mui/material/styles";
import { BaseStyleObj, UIMode } from "@repo/core";
import { AnimatedWrapper } from "@repo/shared-ui";

export interface LikeProps {
  likedByMe: boolean;
  isLiking: boolean;
  handleLike: () => void;
  mode?: UIMode;
  size?: number;
  style?: BaseStyleObj;
}

export const LikeButton = ({
  likedByMe,
  isLiking,
  handleLike,
  mode = "ONLINE",
  size = 24,
  style,
}: LikeProps) => {
  const theme = useTheme();

  const iconColor =
    likedByMe && mode === "ONLINE" ? red[500] : theme.palette.gray[200];

  return (
    <IconButton
      onClick={handleLike}
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
      <AnimatedWrapper
        sx={{ ...(isLiking && { animation: `${pulse()} 0.3s linear` }) }}
      >
        <Heart
          size={size}
          style={{
            fill: likedByMe ? iconColor : "none",
            stroke: iconColor,
          }}
        />
      </AnimatedWrapper>
    </IconButton>
  );
};
