"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import {
  CLIENT_ROUTES,
  MenuRef,
  ScrollRefProps,
  ScrollRefType,
  useGlobalStore,
} from "@repo/core";
import { useMisc, usePage, usePageScroll } from "@repo/shared-hooks";
import { usePopup } from "../../popups/usePopup";

/**
 * Parameters for opening user avatar menus across viewports.
 */
interface AvatarParams {
  desktop: React.MouseEvent<HTMLElement>;
  mobile: { header: React.ReactNode; content: React.ReactNode };
}

/**
 * Encapsulates header state management, scroll tracking, and popup menu actions.
 */
export const useHeader = (scrollRef?: ScrollRefType) => {
  const theme = useTheme();
  const router = useRouter();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const authUser = useGlobalStore((state) => state.authUser);
  const { isDesktop, handleWindowResize } = useMisc();
  const { setLastPage, navigateTo } = usePage();
  const { scrollDir } = usePageScroll({ ref: scrollRef });
  const { openPopup } = usePopup();

  const menuRef = useRef<MenuRef>(null);
  const createPostRef = useRef<MenuRef>(null);

  const isLoggedIn = authStatus === "AUTHENTICATED";
  const isLoggedOut = authStatus === "UNAUTHENTICATED";

  /**
   * Directs the user to the home screen.
   */
  const handleLogo = useCallback(() => {
    navigateTo(CLIENT_ROUTES.home);
  }, [navigateTo]);

  /**
   * Redirects to the notifications view.
   */
  const handleNotification = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setLastPage(CLIENT_ROUTES.notifications);
      router.push(CLIENT_ROUTES.notifications.path);
    },
    [router, setLastPage],
  );

  /**
   * Handles user profile interactions based on active viewport size.
   */
  const handleAvatar = useCallback(
    (element: AvatarParams) => {
      if (isDesktop) {
        menuRef.current?.openMenu(element.desktop.currentTarget);
      } else {
        openPopup({
          name: "APP_MOBILE_MENU",
          content: element.mobile.content,
          header: element.mobile.header,
        });
      }
    },
    [isDesktop, openPopup],
  );

  /**
   * Triggers the post creation dropdown on desktop screens.
   */
  const handleCreatePost = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDesktop) createPostRef.current?.openMenu(e.currentTarget);
    },
    [isDesktop],
  );

  // Sync window resize listener across component life cycle
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleWindowResize]);

  return {
    theme,
    isLoggedIn,
    isLoggedOut,
    isDesktop,
    scrollDir,
    authStatus,
    authUser,
    menuRef,
    createPostRef,
    handleNotification,
    handleLogo,
    handleAvatar,
    handleCreatePost,
    navigateTo,
  };
};
