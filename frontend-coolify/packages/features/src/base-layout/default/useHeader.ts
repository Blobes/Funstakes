"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_ROUTES, MenuRef, useGlobalStore } from "@repo/core";
import { useMisc, usePage, usePageScroll } from "@repo/shared-hooks";
import { usePopup } from "../../popups/usePopup";

/** * Parameters for handling avatar interactions on different screen sizes.
 */
interface AvatarParams {
  desktop: React.MouseEvent<HTMLElement>;
  mobile: { header: React.ReactNode; content: React.ReactNode };
}

/** * Manages logic for the application header, including navigation,
 * scroll direction tracking, and responsive menu behavior.
 */
export const useHeader = (scrollRef?: React.RefObject<HTMLElement | null>) => {
  // Selecting specific state from Zustand store
  const authStatus = useGlobalStore((state) => state.authStatus);
  const authUser = useGlobalStore((state) => state.authUser);

  const { isDesktop, handleWindowResize } = useMisc();
  const { setLastPage, navigateTo } = usePage();
  const { scrollDir } = usePageScroll(scrollRef);
  const { openPopup } = usePopup();

  const router = useRouter();
  const menuRef = useRef<MenuRef>(null);
  const createPostRef = useRef<MenuRef>(null);

  const isLoggedIn = authStatus === "AUTHENTICATED";

  /** * Redirects to the notification center.
   */
  const handleNotification = (e: React.MouseEvent) => {
    e.preventDefault();
    setLastPage(CLIENT_ROUTES.notifications);
    router.push(CLIENT_ROUTES.notifications.path);
  };

  /** * Returns user to the home dashboard.
   */
  const handleLogo = () => {
    navigateTo(CLIENT_ROUTES.home, { loadPage: true });
  };

  /** * Triggers the appropriate menu based on device type.
   */
  const handleAvatar = (element: AvatarParams) => {
    if (isDesktop) {
      menuRef.current?.openMenu(element.desktop.currentTarget);
    } else {
      openMobileNav(element);
    }
  };

  /** * Configures and opens the mobile navigation drawer.
   */
  const openMobileNav = useCallback(
    (element: AvatarParams) => {
      openPopup(
        "APP_MOBILE_MENU",
        element.mobile.content,
        element.mobile.header,
      );
    },
    [openPopup],
  );

  const handleCreatePost = (e: React.MouseEvent<HTMLElement>) => {
    if (isDesktop) createPostRef.current?.openMenu(e.currentTarget);
  };

  // Syncs window resize events with the shared state.
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleWindowResize]);

  return {
    isLoggedIn,
    isDesktop,
    scrollDir,
    authStatus,
    menuRef,
    handleNotification,
    handleLogo,
    handleAvatar,
    openMobileNav,
    navigateTo,
    authUser,
    handleCreatePost,
    createPostRef,
  };
};
