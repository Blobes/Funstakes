"use client";

import React from "react";
import { AppBar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc, usePageScroll } from "@repo/shared-hooks";
import { BaseStyleObj, ScrollRefProps } from "@repo/core";
import { AppLogo } from "./AppLogo";

export interface BaseHeaderProps extends ScrollRefProps {
  logoHref?: string;
  onLogoClick?: () => void;
  hideOnPageScroll?: boolean;
  searchBar?: React.ReactNode;
  children?: React.ReactNode;
  style?: BaseStyleObj;
}

/**
 * Provides the foundational layout, scroll animation, and branding container for application headers.
 */
export const BaseHeader: React.FC<BaseHeaderProps> = ({
  scrollRef,
  logoHref,
  onLogoClick,
  hideOnPageScroll = false,
  searchBar,
  children,
  style,
}) => {
  const theme = useTheme();
  const { isDesktop } = useMisc();
  const { scrollDir } = usePageScroll({ ref: scrollRef });
  const shouldHideHeader = scrollDir === "down" && hideOnPageScroll;

  return (
    <AppBar
      position="sticky"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        zIndex: 500,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.gap(4),
        backdropFilter: "blur(24px)",
        transform: shouldHideHeader ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.3s ease-in-out",
        paddingLeft: !isDesktop
          ? theme.boxSpacing(10) + "!important"
          : undefined,
        ...style,
      }}
    >
      {/* Brand Logo */}
      <AppLogo
        withName
        size={isDesktop ? 160 : 140}
        url={logoHref}
        onClick={onLogoClick}
      />

      {/* Optional Middle Slot (e.g., Search) */}
      {searchBar}

      {/* Right Action Slot */}
      {children}
    </AppBar>
  );
};
