"use client";

import React, { useEffect, useCallback } from "react";
import { WifiOff } from "lucide-react";
import { useSnackbar } from "./useSnackbar";
import { useOffline } from "./useOffline";
import { usePage } from "./usePage";
import {
  getFromLocalStorage,
  removeFromLocalStorage,
  saveToLocalStorage,
} from "@repo/helpers";
import {
  AuthStatus,
  CLIENT_ROUTES,
  COMMON_FEEDBACK,
  useGlobalStore,
} from "@repo/core";
import { useStaticTranslation } from "./useTrans";

/**
 * Manages global window event listeners for network, lifecycle, and transitions.
 */
export const useEventListener = (verifyAuth: () => Promise<void>) => {
  const { setSBMessage, removeSBMessages: removeSBMessages } = useSnackbar();
  const { translateTxtString } = useStaticTranslation();
  const setNetworkStatus = useGlobalStore((state) => state.setNetworkStatus);
  const setIsNavigating = useGlobalStore((state) => state.setIsNavigating);
  const authStatus = useGlobalStore((state) => state.authStatus);

  const { switchToOnlineMode } = useOffline();
  const { navigateTo } = usePage();

  /**
   * Restores online state and verifies session.
   */
  const handleOnline = useCallback(() => {
    removeSBMessages();
    if (!navigator.onLine) return;
    switchToOnlineMode();
    setNetworkStatus("STABLE");
    removeFromLocalStorage("last_auth_status");
    verifyAuth();
    console.log("Network: Online");
  }, [
    removeSBMessages,
    setSBMessage,
    switchToOnlineMode,
    setNetworkStatus,
    verifyAuth,
  ]);

  /**
   * Notifies user of offline status and saves auth intent.
   */
  const handleOffline = useCallback(() => {
    if (!navigator.onLine === false) return;

    const savedLoginStatus = getFromLocalStorage<AuthStatus>({
      key: "last_auth_status",
    });
    const wasLoggedIn = savedLoginStatus === "AUTHENTICATED";

    console.log("Network: Offline");
    setSBMessage({
      msg: {
        id: "offline-notification",
        tagline: translateTxtString(COMMON_FEEDBACK.no_internet_tagline),
        msgStatus: "INFO",
        behavior: "FIXED",
        hasClose: true,
        ...(wasLoggedIn
          ? {
              cta: {
                label: "Go Offline",
                action: () => navigateTo(CLIENT_ROUTES.offline),
              },
            }
          : {}),
        icon: <WifiOff />,
      },
    });
    if (authStatus === "AUTHENTICATED" || authStatus === "UNAUTHENTICATED") {
      saveToLocalStorage<AuthStatus>("last_auth_status", authStatus);
    }
  }, [setSBMessage, navigateTo, authStatus]);

  /**
   * Ensures loading states are cleared when navigating back via history.
   */
  const handlePageTransition = useCallback(
    (event: PageTransitionEvent) => {
      if (event.persisted) setIsNavigating(false);
    },
    [setIsNavigating],
  );

  /**
   * Effect to manage the lifecycle of window event listeners.
   */
  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pageshow", handlePageTransition);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pageshow", handlePageTransition);
    };
  }, [handleOnline, handleOffline, handlePageTransition]);
};
