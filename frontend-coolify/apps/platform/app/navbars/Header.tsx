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
  const { isLoggedIn, isLoggedOut, isDesktop, navigateTo } =
    useHeader(scrollRef);

  const openMobileWebNav = useCallback(
    () =>
      openPopup({
        name: "WEB_MOBILE_MENU",
        content: <MobileNav />,
      }),
    [openPopup, theme],
  );

  return (
    <BaseHeader scrollRef={scrollRef} hideOnPageScroll>
      {/* Right controls specific to public view */}
      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.gap(16),
          [theme.breakpoints.down("md")]: {
            gap: theme.gap(8),
          },
        }}
      >
        {isDesktop && (
          <DesktopNav
            style={{
              listWrapper: {
                display: { xs: "none", md: "flex" },
                gap: theme.gap(4),
              },
            }}
          />
        )}

        {isLoggedIn && (
          <AppButton
            variant="outlined"
            size="small"
            href={CLIENT_ROUTES.home.path}
            onClick={() => navigateTo(CLIENT_ROUTES.home)}
          >
            <TransText {...COMMON_BUTTON_LABELS.go_to_funstakes} noComponent />
          </AppButton>
        )}

        {isLoggedOut && (
          <Stack
            sx={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.gap(6),
            }}
          >
            <AppButton
              variant="outlined"
              size="small"
              href={CLIENT_ROUTES.login.path}
              onClick={() => navigateTo(CLIENT_ROUTES.login)}
            >
              <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
            </AppButton>
            {isDesktop && (
              <AppButton
                variant="contained"
                size="small"
                href={CLIENT_ROUTES.signup.path}
                onClick={() => navigateTo(CLIENT_ROUTES.signup)}
              >
                <TransText {...AUTH_BUTTON_LABELS.signup} noComponent />
              </AppButton>
            )}
          </Stack>
        )}

        {/* Mobile hamburger (logged out only) */}
        {!isDesktop && (
          <IconButton onClick={openMobileWebNav} aria-label="Open menu">
            <Menu style={{ stroke: theme.palette.gray[300] }} />
          </IconButton>
        )}
      </Stack>
    </BaseHeader>
  );
};
