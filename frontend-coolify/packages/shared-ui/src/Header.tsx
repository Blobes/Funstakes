"use client";

import React from "react";
import { AppBar, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc, usePageScroll } from "@repo/shared-hooks";
import { BaseStyleObj, ScrollRefProps } from "@repo/core";
import { AnchorLink } from "./Buttons";
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
        ...style,
      }}
    >
      {/* Brand Logo */}
      <AnchorLink
        href={logoHref}
        onClick={onLogoClick}
        style={{ display: "inline-flex" }}
      >
        <AppLogo withName size={isDesktop ? 160 : 140} />
      </AnchorLink>

      {/* Optional Middle Slot (e.g., Search) */}
      {searchBar}

      {/* Right Action Slot */}
      <Stack direction="row" alignItems="center" spacing={theme.gap(4)}>
        {children}
      </Stack>
    </AppBar>
  );
};
