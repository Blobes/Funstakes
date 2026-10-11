"use client";

import React from "react";
import { Skeleton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BaseStyleObj } from "@repo/core";

type Variant = "text" | "rectangular" | "rounded" | "circular";
type Animation = "pulse" | "wave";

interface BaseProps {
  quantity?: number;
  variant?: Variant;
  animation?: Animation;
  bgColor?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  containerStyle?: BaseStyleObj;
}

interface PostSkeletonProps extends BaseProps {
  avatar?: BaseProps;
  authorInfo?: BaseProps;
  body?: BaseProps;
}

export const PostSkeleton = ({
  quantity = 2,
  bgColor,
  avatar,
  animation = "pulse",
  authorInfo,
  body,
  containerStyle,
}: PostSkeletonProps) => {
  const theme = useTheme();

  const avatarStyle = {
    flex: "none",
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: avatar?.width || 36,
    height: avatar?.height || 36,
  };
  const authorInfoStyle = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: authorInfo?.width || "100%",
    height: authorInfo?.height || 14,
    radius: 0,
  };
  const bodyStyle = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: body?.width || "100%",
    height: body?.height || 300,
    radius: 0,
  };

  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8), ...containerStyle }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Stack
          key={index}
          sx={{ width: "inherit", gap: theme.gap(4), ...containerStyle }}
        >
          {/* Post Header*/}
          <Stack
            sx={{
              width: "inherit",
              alignItems: "center",
              flexDirection: "row",
              [theme.breakpoints.down("md")]: {
                paddingX: theme.boxSpacing(6),
              },
            }}
          >
            {/* Avatar */}
            <Skeleton
              variant={avatar?.variant || "circular"}
              animation={animation}
              sx={{ ...avatarStyle }}
            />
            {/* Author info */}
            <Stack sx={{ width: "inherit", gap: theme.gap(3) }}>
              <Skeleton
                variant={authorInfo?.variant || "rectangular"}
                animation={animation}
                sx={{ ...authorInfoStyle }}
              />
              <Skeleton
                variant={authorInfo?.variant || "rectangular"}
                animation={animation}
                sx={{ ...authorInfoStyle }}
              />
            </Stack>
          </Stack>

          {/* Post Body */}
          <Skeleton
            variant={body?.variant || "rectangular"}
            animation={animation}
            sx={{ ...bodyStyle }}
          />
        </Stack>
      ))}
    </Stack>
  );
};

export const BoxSkeleton = ({
  variant = "rectangular",
  animation = "pulse",
  quantity = 2,
  bgColor,
  width,
  height,
  radius,
  containerStyle,
}: BaseProps) => {
  const theme = useTheme();
  const style = {
    bgcolor: bgColor || theme.palette.gray.trans[1],
    width: width || "100%",
    height: height || 300,
    radius: radius || 0,
    ...containerStyle,
  };
  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      {Array.from({ length: quantity }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          animation={animation}
          sx={{ ...style }}
        />
      ))}
    </Stack>
  );
};
