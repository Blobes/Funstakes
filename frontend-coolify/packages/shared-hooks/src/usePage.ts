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
  const setIsPageLoading = useGlobalStore((state) => state.setIsPageLoading);
  const setIsNavigating = useGlobalStore((state) => state.setIsNavigating);
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
      saveToLocalStorage(STORAGE_KEYS.SAVED_PAGE, page);
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

      try {
        if (event) event.preventDefault();

        if (!isCrossZone) setIsPageLoading(true);

        if (drawerContent) closeDrawer();
        if (modalContent) closeModal();

        if (savePage && !isOnDoNotSave(page.path)) setLastPage(page);

        if (isCrossZone) {
          window.location.assign(page.path);
          return;
        }

        if (type === "push") router.push(page.path);
        if (type === "replace") router.replace(page.path);

        if (loadPage) await delay(400);
      } finally {
        setIsNavigating(false);
        setIsPageLoading(false);
      }
    },
    [
      drawerContent,
      modalContent,
      closeDrawer,
      closeModal,
      setLastPage,
      setIsPageLoading,
      setIsNavigating,
      router,
    ],
  );

  /**
   * Synchronizes route change and enforces access control.
   */
  const handlePageChange = useCallback(async () => {
    const temporarySession = getCookie(STORAGE_KEYS.TEMPORARY_SESSION);
    const tempSessionValid =
      temporarySession && parseInt(temporarySession, 10) > Date.now();
    setInlineMsg(null);

    if (routeGuards.isRedirecting) {
      if (tempSessionValid) return; // Disabled auto redirect if there is an available temporary session

      const redirect = REDIRECT_MAP.find(({ guard }) => routeGuards[guard]);
      if (redirect) {
        setPendingPath(redirect.target.path);
        await navigateTo(redirect.target, {
          loadPage: true,
          savePage: isOnDoNotSave(redirect.target.path) ? false : true,
        });
        setIsNavigating(pendingPath !== null);
        return;
      }
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
    isDoNotSaveRoute,
    setPendingPath,
    setIsNavigating,
  ]);

  return {
    ...routeGuards,
    setLastPage,
    isOnWeb,
    isOnAuth,
    isOnDisallowed,
    isOnUnprotected,
    isOnDoNotSave,
    navigateTo,
    handlePageChange,
  };
};
