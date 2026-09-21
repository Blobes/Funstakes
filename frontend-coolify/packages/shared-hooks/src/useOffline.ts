"use client";

import { useCallback } from "react";
import { usePage } from "./usePage";
import { getFromLocalStorage } from "@repo/helpers";
import { CLIENT_ROUTES, IPage, useGlobalStore } from "@repo/core";

/**
 * Manages transitions between online and offline application states.
 */
export const useOffline = () => {
  // Use atomic selector for the setter to avoid unnecessary subscriptions
  const setOfflineMode = useGlobalStore((state) => state.setOfflineMode);

  const { navigateTo } = usePage();

  /**
   * Activates offline mode and redirects to the offline content route.
   */
  const switchToOfflineMode = useCallback(() => {
    setOfflineMode(true);

    navigateTo(CLIENT_ROUTES.offline);
  }, [setOfflineMode, navigateTo]);

  /**
   * Restores online mode and redirects back to the last saved page or home.
   */
  const switchToOnlineMode = useCallback(() => {
    setOfflineMode(false);

    // Retrieve the last known location or fallback to home
    const savedPage = getFromLocalStorage<IPage>() || CLIENT_ROUTES.home;
    navigateTo(savedPage, { type: "replace" });
  }, [setOfflineMode, navigateTo]);

  return {
    switchToOfflineMode,
    switchToOnlineMode,
  };
};
