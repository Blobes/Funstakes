"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericStyle, IStake } from "@repo/core";
import { usePostSeen } from "../post/hooks/usePostSeen";
import { TransText } from "@repo/shared-ui";

interface StakeProps {
  stake: IStake;
  style?: GenericStyle;
}

export const StakeCard = ({ stake, style = {} }: StakeProps) => {
  const theme = useTheme();
  const { content, media } = stake;

  const { elementRef } = usePostSeen({ ...stake, postType: "STAKE" });

  return (
    <Stack
      ref={elementRef as React.RefObject<HTMLDivElement>}
      sx={{
        gap: theme.gap(0),
        flexGrow: "0",
        flexShrink: "0",
        minHeight: "200px",
        background: `center / cover no-repeat url(${media[0].url}),
                ${theme.palette.gray.trans.overlay()}`,
        borderRadius: theme.radius[3],
        ...style,
      }}
    >
      {/* Post content */}
      <TransText
        sx={{
          ...theme.typography.text3,
          padding: theme.boxSpacing(6, 0),
          textAlign: "center",
          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(6),
          },
        }}
      >
        {content}
      </TransText>
    </Stack>
  );
};
