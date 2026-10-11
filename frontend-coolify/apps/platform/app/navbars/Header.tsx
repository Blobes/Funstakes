"use client";

import React, { useCallback } from "react";
import { Stack, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Menu } from "lucide-react";
import { DesktopNav, MobileNav } from "./Nav";
import { AppButton, BaseHeader, TransText } from "@repo/shared-ui";
import {
  AUTH_BUTTON_LABELS,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  ScrollRefProps,
} from "@repo/core";
import { useHeader, usePopup } from "@repo/features";

/**
 * Handles navigation layout and actions for public marketing web pages.
 */
export const Header: React.FC<ScrollRefProps> = ({ scrollRef }) => {
  const theme = useTheme();
  const { openPopup } = usePopup();
  const { isLoggedIn, isDesktop, authStatus, navigateTo } =
    useHeader(scrollRef);

  const openMobileWebNav = useCallback(
    () =>
      openPopup({
        name: "WEB_MOBILE_MENU",
        content: <MobileNav style={{ gap: theme.gap(4) }} />,
      }),
    [openPopup, theme],
  );

  return (
    <BaseHeader
      scrollRef={scrollRef}
      logoHref={CLIENT_ROUTES.about.path}
      onLogoClick={() => navigateTo(CLIENT_ROUTES.about)}
      hideOnPageScroll
      style={{
        paddingLeft: !isDesktop
          ? theme.boxSpacing(10) + "!important"
          : undefined,
      }}
    >
      {/* Right controls specific to public marketing view */}
      {isDesktop && (
        <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
          <DesktopNav
            style={{
              display: { xs: "none", md: "flex", flexDirection: "row" },
              gap: theme.gap(4),
            }}
          />

          {isLoggedIn && (
            <AppButton
              variant="outlined"
              size="small"
              href={CLIENT_ROUTES.home.path}
              onClick={() => navigateTo(CLIENT_ROUTES.home)}
            >
              <TransText
                {...COMMON_BUTTON_LABELS.go_to_funstakes}
                noComponent
              />
            </AppButton>
          )}

          {authStatus === "UNAUTHENTICATED" && (
            <Stack direction="row" alignItems="center" spacing={theme.gap(0)}>
              <AppButton
                variant="contained"
                size="small"
                href={CLIENT_ROUTES.signup.path}
                onClick={() => navigateTo(CLIENT_ROUTES.signup)}
              >
                <TransText {...AUTH_BUTTON_LABELS.signup} noComponent />
              </AppButton>
              <AppButton
                variant="outlined"
                size="small"
                href={CLIENT_ROUTES.login.path}
                onClick={() => navigateTo(CLIENT_ROUTES.login)}
              >
                <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
              </AppButton>
            </Stack>
          )}
        </Stack>
      )}

      {/* Mobile hamburger (logged out only) */}
      {!isDesktop && (
        <IconButton onClick={openMobileWebNav} aria-label="Open menu">
          <Menu />
        </IconButton>
      )}
    </BaseHeader>
  );
};
