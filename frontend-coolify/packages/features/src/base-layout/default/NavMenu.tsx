"use client";

import React, { useRef } from "react";
import { Divider, Stack, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Strip,
  RenderItemList,
  ThemeSwitcher,
  StatusSwitcher,
  DisplayList,
  TransText,
} from "@repo/shared-ui";
import { summarizeNum } from "@repo/helpers";
import { SlidersHorizontal, WalletMinimal } from "lucide-react";
import { useMisc, useStaticTranslation } from "@repo/shared-hooks";
import { LISTS, MenuRef, POST_FEEDBACK, useGlobalStore } from "@repo/core";
import { Logout } from "../../apps/auth/logout/Logout";
import { useCreatePost } from "../../apps/post/hooks/useCreatePost";
import { CREATE_POST } from "../../apps/post/constants";

export const HeaderDesktopNav = ({
  menuRef,
}: {
  menuRef: React.RefObject<MenuRef | null>;
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { USER_NAV_LIST } = LISTS(translateTxtString);
  const { closeDrawer } = useMisc();

  return (
    <Stack
      sx={{
        display: {
          xs: "none",
          md: "flex",
        },
        position: "absolute",
        gap: theme.gap(4),
      }}
    >
      <DisplayList
        menuRef={menuRef}
        list={USER_NAV_LIST}
        onItemClick={closeDrawer}
      />
    </Stack>
  );
};

// Mobile-specific wrapper for the same RenderList
// User info
const UserInfo = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  if (!authUser) return null;

  const { firstName, lastName, username, followersCount, followingCount } =
    authUser;
  return (
    <Stack>
      <Stack
        sx={{
          gap: theme.gap(4),
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Stack sx={{ gap: theme.gap(0), width: "100%" }}>
          <TransText sx={{ ...theme.typography.text2, fontWeight: "600" }}>
            {firstName} {lastName}
          </TransText>
          <TransText
            sx={{ ...theme.typography.text3, color: theme.palette.gray[200] }}
          >
            {username}
          </TransText>
        </Stack>
        <IconButton sx={{ ...theme.typography.text1 }}>
          <WalletMinimal style={{ width: "20px", height: "20px" }} />
          12K
        </IconButton>
      </Stack>
      <Divider />
      <Strip
        items={[
          {
            text: (followersCount ?? 0 > 1) ? " Followers" : " Follower",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followersCount ?? 0)}
              </strong>
            ),
          },
          {
            text: " Following",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followingCount ?? 0)}
              </strong>
            ),
          },
          {
            text: " Likes",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(3)}
              </strong>
            ),
          },
        ]}
        style={{
          ...theme.typography.text6,
          justifyContent: "space-between",
        }}
      />
    </Stack>
  );
};

export const HeaderMobileNav = ({}) => {
  const theme = useTheme();
  const { USER_NAV_LIST } = LISTS();
  const menuRef = useRef<MenuRef>(null);
  const { closeDrawer } = useMisc();

  return (
    <Stack>
      <UserInfo />
      <Divider />
      <Stack gap={theme.gap(10)}>
        <RenderItemList
          list={USER_NAV_LIST}
          onItemClick={() => {
            menuRef.current?.closeMenu();
            closeDrawer();
          }}
          displayActiveState={false}
          style={{
            ...theme.typography.text2,
            gap: theme.gap(10),
            padding: 0,
            background: "transparent",
            width: "100%",
            "&:hover": {
              background: "transparent",
              color: theme.palette.primary.dark + "!important",
            },
            "& svg": {
              width: "22px",
              height: "22px",
            },
          }}
        />
        <Divider />
        <StatusSwitcher />
        <ThemeSwitcher />
        <Stack direction="row" gap={theme.gap(10)} alignItems="center">
          <SlidersHorizontal style={{ width: "18px", height: "18px" }} />
          <TransText
            {...POST_FEEDBACK.filter_feed}
            sx={{ ...theme.typography.text3, fontWeight: "600" }}
          />
        </Stack>
        <Logout />
      </Stack>
    </Stack>
  );
};

export const CreatePostMenuDesktop = ({
  postRef,
}: {
  postRef: React.RefObject<MenuRef | null>;
}) => {
  const theme = useTheme();
  const { CREATE_POST_LIST } = LISTS();
  const { openCreatePost } = useCreatePost();

  return (
    <Stack
      sx={{
        display: {
          xs: "none",
          md: "flex",
        },
        position: "absolute",
        gap: theme.gap(4),
      }}
    >
      <DisplayList
        menuRef={postRef}
        list={CREATE_POST_LIST}
        onItemClick={(item) => {
          if (!item?.title) return;
          const lookupKey =
            item.title.toLowerCase() as keyof typeof CREATE_POST;
          const targetComponent = CREATE_POST[lookupKey];
          openCreatePost(targetComponent);
        }}
      />
    </Stack>
  );
};
