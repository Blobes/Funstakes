"use client";

import { useCallback, useState } from "react";
import {
  DISALLOWED_ROUTES,
  IPage,
  NavigateOptions,
  ROUTES_REGISTRY,
  STORAGE_KEYS,
  useGlobalStore,
} from "@repo/core";
import {
  extractPageTitle,
  getFromLocalStorage,
  crossZoneCheck,
  saveToLocalStorage,
  delay,
  getCookie,
} from "@repo/helpers";
import { usePathname, useRouter } from "next/navigation";
import { useMisc } from "./useMisc";
import { REDIRECT_MAP, useRouteGuards } from "./useRouteGuards";

/**
 * Manages page transitions, routing logic, and navigation state.
 */
export const usePage = () => {
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const setPage = useGlobalStore((state) => state.setPage);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const { closeDrawer, closeModal } = useMisc();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Helper functions for route classification.
   */
  const isOnWeb = useCallback(
    (path: string) => ROUTES_REGISTRY.web.includes(path),
    [],
  );
  const isOnAuth = useCallback(
    (path: string) => ROUTES_REGISTRY.auth.includes(path),
    [],
  );
  const isOnOffline = useCallback(
    (path: string) => ROUTES_REGISTRY.offline.includes(path),
    [],
  );
  const isOnUnprotected = useCallback(
    (path: string) => ROUTES_REGISTRY.unprotected.includes(path),
    [],
  );
  const isOnDoNotSave = useCallback(
    (path: string) => ROUTES_REGISTRY.doNotSave.includes(path),
    [],
  );
  const isOnDisallowed = useCallback(
    (path: string) => DISALLOWED_ROUTES.includes(path),
    [],
  );

  const isAuthRoute = isOnAuth(pathname);
  const isOfflineRoute = isOnOffline(pathname);
  const isDoNotSaveRoute = isOnDoNotSave(pathname);
  const routeGuards = useRouteGuards(pathname, pendingPath);

  /**
   * Persists the last visited page to state and local storage.
   */
  const setLastPage = useCallback(
    ({ title, path }: IPage) => {
      const page = { title, path };
      setPage(page);
      saveToLocalStorage("saved_page", page);
    },
    [setPage],
  );

  /**
   * Core navigation handler managing SPA transitions and cross-zone jumps.
   */
  const navigateTo = useCallback(
    async (page: IPage, options: NavigateOptions = {}) => {
      const {
        type = "push",
        savePage = true,
        loadPage = false,
        event,
      } = options;
      const isCrossZone = crossZoneCheck(page.path);
      setPendingPath(page.path);

      if (event) event.preventDefault();

      if (loadPage || isCrossZone) setGlobalLoading(true);

      // UI Cleanup
      if (drawerContent) closeDrawer();
      if (modalContent) closeModal();

      if (savePage && !isOnDoNotSave(page.path)) setLastPage(page);

      // EXTERNAL: Cross-zone or Root dynamic navigation
      if (isCrossZone) {
        window.location.assign(page.path);
        return;
      }

      // INTERNAL: Standard Next.js SPA navigation
      if (type === "push") router.push(page.path);
      if (type === "replace") router.replace(page.path);

      // Ensure loading is reset after navigation triggers
      if (loadPage) await delay(400);
      setPendingPath(null);
      setGlobalLoading(false);
    },
    [
      drawerContent,
      modalContent,
      closeDrawer,
      closeModal,
      setLastPage,
      setGlobalLoading,
      setPendingPath,
      router,
    ],
  );

  /**
   * Synchronizes route change and enforces access control.
   */
  const handlePageChange = useCallback(() => {
    const temporarySession = getCookie(STORAGE_KEYS.TEMPORARY_SESSION_KEY);

    setInlineMsg(null);
    setPendingPath(null);
    setGlobalLoading(false);

    if (routeGuards.isRedirecting) {
      if (!temporarySession) return; // Temporarily disabled check for testing purposes

      const redirect = REDIRECT_MAP.find(({ guard }) => routeGuards[guard]);
      if (redirect)
        navigateTo(redirect.target, {
          loadPage: true,
          savePage: isOnDoNotSave(redirect.target.path) ? false : true,
        });
      return;
    }
    if (isDoNotSaveRoute) return;

    const savedPage = getFromLocalStorage<IPage>();
    setLastPage(
      savedPage ?? { title: extractPageTitle(pathname), path: pathname },
    );
  }, [
    routeGuards,
    pathname,
    isAuthRoute,
    isOfflineRoute,
    setLastPage,
    setInlineMsg,
    navigateTo,
    setPendingPath,
  ]);

  return {
    setLastPage,
    isOnWeb,
    isOnAuth,
    isOnDisallowed,
    isOnUnprotected,
    isOnDoNotSave,
    navigateTo,
    handlePageChange,
    ...routeGuards,
  };
};
