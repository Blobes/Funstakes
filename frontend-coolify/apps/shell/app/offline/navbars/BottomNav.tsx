"use client";

import React from "react";
import { AppBar, Typography, useTheme } from "@mui/material";
import { usePageScroll } from "@repo/shared-hooks";

interface NavProps {
  scrollRef?: React.RefObject<HTMLElement | null>;
}
export const BottomNav: React.FC<NavProps> = ({ scrollRef }) => {
  const theme = useTheme();
  const { scrollDir } = usePageScroll(scrollRef);

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
      <Typography>Offline Bottom navigation</Typography>
    </AppBar>
  );
};
