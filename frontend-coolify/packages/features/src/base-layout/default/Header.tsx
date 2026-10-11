"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { Bell } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import {
  CreatePostMenuDesktop,
  HeaderDesktopNav,
  HeaderMobileNav,
} from "./NavMenu";
import {
  UserAvatar,
  AppButton,
  SearchBar,
  TransText,
  BaseHeader,
} from "@repo/shared-ui";
import { useHeader } from "./useHeader";
import {
  AUTH_BUTTON_LABELS,
  CLIENT_ROUTES,
  POST_BUTTON_LABELS,
  ScrollRefProps,
} from "@repo/core";

/**
 * Handles navigation layout and interaction actions for authenticated application views.
 */
export const AppHeader: React.FC<ScrollRefProps> = ({ scrollRef }) => {
  const theme = useTheme();
  const {
    isLoggedIn,
    isDesktop,
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
    <BaseHeader
      scrollRef={scrollRef}
      logoHref={CLIENT_ROUTES.home.path}
      onLogoClick={handleLogo}
      searchBar={isDesktop && isLoggedIn ? <SearchBar /> : undefined}
      hideOnPageScroll={isDesktop ? false : true}
    >
      {/* Right controls specific to internal app view */}
      {isLoggedIn && (
        <>
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
            <Bell style={{ width: "100%", stroke: theme.palette.gray[200] }} />
          </IconButton>

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

      {isLoggedIn && isDesktop && (
        <>
          <CreatePostMenuDesktop postRef={createPostRef} />
          <AppButton variant="outlined" size="small" onClick={handleCreatePost}>
            <TransText {...POST_BUTTON_LABELS.create_post} noComponent />
          </AppButton>
        </>
      )}

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
    </BaseHeader>
  );
};
