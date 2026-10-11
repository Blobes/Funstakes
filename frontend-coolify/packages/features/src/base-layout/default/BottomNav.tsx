"use client";

import React from "react";
import { AppBar, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { usePageScroll } from "@repo/shared-hooks";
import { ScrollRefProps } from "@repo/core";

export const BottomNav: React.FC<ScrollRefProps> = ({ scrollRef }) => {
  const { scrollDir } = usePageScroll({ ref: scrollRef });
  const theme = useTheme();

  return (
    <AppBar
      position="absolute"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        // borderTop: `1px solid ${theme.palette.gray.trans[1]}`,
        zIndex: 500,
        padding: theme.boxSpacing(6),
        // backgroundColor: theme.palette.gray[0],
        top: "unset",
        bottom: 0,
        backdropFilter: "blur(24px)",
        transition: "transform 0.3s ease-in-out",
        transform: scrollDir === "down" ? "translateY(100%)" : "translateY(0)",
      }}
    >
      <Typography>Bottom navigation</Typography>
    </AppBar>
  );
};
