"use client";

import React, { useRef } from "react";
import { Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RenderItemList, AppButton, TransText } from "@repo/shared-ui";
import { useMisc, usePage, useStaticTranslation } from "@repo/shared-hooks";
import {
  AUTH_BUTTON_LABELS,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  GenericStyle,
  LISTS,
  MenuRef,
  useGlobalStore,
} from "@repo/core";

interface NavProps {
  style?: GenericStyle;
}
export const DesktopNav: React.FC<NavProps> = ({ style }) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { HEADER_NAV_LIST } = LISTS(translateTxtString);

  return (
    <Stack sx={{ ...style }}>
      <RenderItemList
        list={HEADER_NAV_LIST}
        style={{
          padding: theme.boxSpacing(2.5, 6, 2.5, 6),
          fontWeight: "500",
          "& svg": {
            width: "16px",
            height: "16px",
          },
        }}
      />
    </Stack>
  );
};

export const MobileNav: React.FC<NavProps> = ({ style }) => {
  const theme = useTheme();
  const { HEADER_NAV_LIST } = LISTS();
  const menuRef = useRef<MenuRef>(null);
  const { navigateTo } = usePage();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { closeDrawer } = useMisc();

  return (
    <Stack sx={{ ...style }}>
      <RenderItemList
        list={HEADER_NAV_LIST}
        onItemClick={() => {
          menuRef.current?.closeMenu();
          closeDrawer();
        }}
        style={{
          padding: theme.boxSpacing(4, 6),
          textAlign: "left",
          gap: theme.boxSpacing(6),
          width: "100%",
          "& svg": {
            width: "20px",
            height: "20px",
          },
        }}
      />
      <Divider />
      {authStatus === "AUTHENTICATED" && (
        <AppButton
          variant="outlined"
          size="small"
          href={CLIENT_ROUTES.home.path}
          onClick={() => navigateTo(CLIENT_ROUTES.home)}
        >
          <TransText {...COMMON_BUTTON_LABELS.go_to_funstakes} noComponent />
        </AppButton>
      )}

      {authStatus === "UNAUTHENTICATED" && (
        <>
          <AppButton
            variant="contained"
            size="small"
            href={CLIENT_ROUTES.signup.path}
            onClick={() => navigateTo(CLIENT_ROUTES.signup)}
          >
            <TransText {...AUTH_BUTTON_LABELS.signup} noComponent />
            Sign up
          </AppButton>
          <AppButton
            variant="outlined"
            size="small"
            href={CLIENT_ROUTES.login.path}
            onClick={() => navigateTo(CLIENT_ROUTES.login)}
          >
            Login
          </AppButton>
        </>
      )}
    </Stack>
  );
};
