"use client";

import React from "react";
import { AppBar, Stack, IconButton } from "@mui/material";
import { Bell } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import {
  CreatePostMenuDesktop,
  HeaderDesktopNav,
  HeaderMobileNav,
} from "./NavMenu";
import {
  UserAvatar,
  AnchorLink,
  AppButton,
  SearchBar,
  TransText,
  AppLogo,
} from "@repo/shared-ui";
import { useHeader } from "./useHeader";
import {
  AUTH_BUTTON_LABELS,
  CLIENT_ROUTES,
  POST_BUTTON_LABELS,
} from "@repo/core";

interface HeaderProps {
  scrollRef?: React.RefObject<HTMLElement | null>;
}

export const AppHeader: React.FC<HeaderProps> = ({ scrollRef }) => {
  const theme = useTheme();
  const {
    isLoggedIn,
    isDesktop,
    scrollDir,
    authStatus,
    menuRef,
    handleNotification,
    handleLogo,
    handleAvatar,
    navigateTo,
    authUser,
    createPostRef,
    handleCreatePost,
  } = useHeader(scrollRef);

  return (
    <AppBar
      position="sticky"
      component="nav"
      sx={{
        zIndex: 500,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.gap(4),
        backdropFilter: "blur(24px)",
        ...(!isDesktop && {
          transform:
            scrollDir === "down" ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.3s ease-in-out",
        }),
      }}
    >
      {/* Logo */}
      <AnchorLink
        href={CLIENT_ROUTES.home.path}
        onClick={handleLogo}
        style={{ display: "inline-flex" }}
      >
        <AppLogo size={isDesktop ? 40 : 34} />
      </AnchorLink>

      {/* Search */}
      {isDesktop && isLoggedIn && <SearchBar />}

      {/* Right controls */}
      <Stack direction="row" alignItems="center" spacing={theme.gap(6)}>
        {isLoggedIn && (
          <>
            {/* Notification */}
            <IconButton
              onClick={handleNotification}
              href={CLIENT_ROUTES.notifications.path}
              sx={{
                width: 36,
                height: 36,
                padding: theme.boxSpacing(4),
                border: `1px solid ${theme.palette.gray.trans[1]}`,
              }}
            >
              <Bell
                style={{ width: "100%", stroke: theme.palette.gray[200] }}
              />
            </IconButton>

            {/* User Avatar  */}
            {isDesktop && <HeaderDesktopNav menuRef={menuRef} />}
            <UserAvatar
              userInfo={authUser}
              toolTipValue="Open menu"
              style={{
                width: "34px",
                height: "34px",
                marginLeft: "unset!important",
                [theme.breakpoints.down("md")]: {
                  width: "28px",
                  height: "28px",
                },
              }}
              onClick={(event: React.MouseEvent<HTMLElement>) =>
                handleAvatar({
                  desktop: event,
                  mobile: {
                    header: (
                      <UserAvatar
                        userInfo={authUser}
                        style={{ width: "35px", height: "35px" }}
                      />
                    ),
                    content: <HeaderMobileNav />,
                  },
                })
              }
            />
          </>
        )}

        {/* Create post  */}
        {isLoggedIn && isDesktop && (
          <>
            <CreatePostMenuDesktop postRef={createPostRef} />
            <AppButton
              variant="outlined"
              size="small"
              onClick={handleCreatePost}
            >
              <TransText {...POST_BUTTON_LABELS.create_post} noComponent />
            </AppButton>
          </>
        )}

        {/* Login Button */}
        {authStatus === "UNAUTHENTICATED" && (
          <AppButton
            variant="outlined"
            size="small"
            href={CLIENT_ROUTES.login.path}
            onClick={() => navigateTo(CLIENT_ROUTES.login)}
          >
            <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
          </AppButton>
        )}
      </Stack>
    </AppBar>
  );
};
