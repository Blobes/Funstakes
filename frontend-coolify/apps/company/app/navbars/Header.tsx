"use client";

import React, { useCallback, useEffect } from "react";
import { AppBar, Stack, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc, usePage } from "@repo/shared-hooks";
import { DesktopNav, MobileNav } from "./Nav";
import { AnchorLink, AppButton, TransText } from "@repo/shared-ui";
import Image from "next/image";
import { Menu } from "lucide-react";
import { asset } from "@repo/assets";
import {
  AUTH_BUTTON_LABELS,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  useGlobalStore,
} from "@repo/core";
import { usePopup } from "@repo/features";

export const Header: React.FC = () => {
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { isDesktop, handleWindowResize } = useMisc();
  const { navigateTo } = usePage();
  const theme = useTheme();
  const isLoggedIn = authStatus === "AUTHENTICATED";
  const { openPopup } = usePopup();

  /* -------------------------------- handlers --------------------------------- */
  const openMobileWebNav = useCallback(
    () =>
      openPopup({
        name: "WEB_MOBILE_MENU",
        content: (
          <MobileNav
            style={{
              gap: theme.gap(4),
            }}
          />
        ),
      }),
    [openPopup],
  );

  /* ---------------------------------- effects --------------------------------- */
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    // openMobileWebNav();
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AppBar
      position="sticky"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        zIndex: 500,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        gap: theme.gap(6),
        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
      }}
    >
      {/* Logo */}
      <AnchorLink
        href={CLIENT_ROUTES.about.path}
        onClick={() => navigateTo(CLIENT_ROUTES.about)}
      >
        <Image
          src={asset.appLogoSymbol}
          alt="logo"
          style={{
            width: 34,
            height: 34,
            borderRadius: `${theme.radius.full}`,
          }}
        />
      </AnchorLink>

      {/* Right controls */}
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
    </AppBar>
  );
};
