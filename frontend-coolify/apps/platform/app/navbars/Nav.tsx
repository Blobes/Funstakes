"use client";

import React, { useRef } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RenderItemList, AppButton, TransText } from "@repo/shared-ui";
import { useMisc, usePage, useStaticTranslation } from "@repo/shared-hooks";
import {
  AUTH_BUTTON_LABELS,
  CLIENT_ROUTES,
  NAV_LISTS,
  MenuRef,
  useGlobalStore,
  COMMON_BUTTON_LABELS,
  BaseStyleProps,
} from "@repo/core";

interface NavProps {
  style?: BaseStyleProps;
}
export const DesktopNav: React.FC<NavProps> = ({ style }) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { HEADER_NAV_LIST } = NAV_LISTS(translateTxtString);

  return (
    <RenderItemList
      list={HEADER_NAV_LIST}
      style={{
        item: {
          ...style?.item,
        },
        itemWrapper: {
          padding: theme.boxSpacing(2.5, 6, 2.5, 6),
          "& svg": {
            width: 16,
            height: 16,
          },
          ...style?.itemWrapper,
        },
        listWrapper: {
          gap: theme.gap(12),
          ...style?.listWrapper,
        },
      }}
    />
  );
};

export const MobileNav: React.FC<NavProps> = ({ style }) => {
  const theme = useTheme();
  const { HEADER_NAV_LIST } = NAV_LISTS();
  const menuRef = useRef<MenuRef>(null);
  const { navigateTo } = usePage();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { closeDrawer } = useMisc();

  return (
    <Stack sx={{ gap: theme.gap(12) }}>
      <RenderItemList
        list={HEADER_NAV_LIST}
        onItemClick={() => {
          menuRef.current?.closeMenu();
          closeDrawer();
        }}
        style={{
          item: {
            fontSize: theme.typography.text2.fontSize,
            textAlign: "left",
            gap: theme.gap(8),
            smScreen: { gap: theme.gap(12) },
            ...style?.item,
          },
          itemWrapper: {
            width: "100%",
            padding: theme.boxSpacing(4, 6),
            gap: theme.gap(6),
            "& svg": {
              width: 20,
              height: 20,
            },
            smScreen: {
              "& svg": {
                width: 24,
                height: 24,
              },
            },
            ...style?.itemWrapper,
          },
          listWrapper: {
            gap: theme.gap(6),
            flexDirection: "column",
            ...style?.listWrapper,
          },
        }}
      />
      {/* <Divider sx={{ borderColor: theme.palette.gray.trans[1] }} /> */}
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
        <AppButton
          variant="contained"
          size="small"
          href={CLIENT_ROUTES.signup.path}
          onClick={() => navigateTo(CLIENT_ROUTES.signup)}
          style={{ paddingY: theme.boxSpacing(6), margin: theme.boxSpacing(4) }}
        >
          <TransText {...AUTH_BUTTON_LABELS.signup} noComponent />
        </AppButton>
      )}
    </Stack>
  );
};
