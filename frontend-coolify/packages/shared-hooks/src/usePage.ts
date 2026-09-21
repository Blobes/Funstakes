"use client";

import { useCallback, useRef } from "react";
import {
  DISALLOWED_ROUTES,
  IPage,
  isInRouteRegistry,
  NavigateOptions,
  ROUTES_REGISTRY,
  STORAGE_KEYS,
  useGlobalStore,
} from "@repo/core";
import {
  extractPageTitle,
  getFromLocalStorage,
  saveToLocalStorage,
  delay,
  getCookie,
  crossZoneCheck,
} from "@repo/helpers";
import { usePathname, useRouter } from "next/navigation";
import { useMisc } from "./useMisc";
import { REDIRECT_MAP, useRouteGuards } from "./useRouteGuards";

/**
 * Manages page transitions, routing logic, and navigation state.
 */
export const usePage = () => {
  const setIsSpaLoading = useGlobalStore((state) => state.setIsSpaLoading);
  const setIsCrossZoneLoading = useGlobalStore(
    (state) => state.setIsCrossZoneLoading,
  );
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const setPage = useGlobalStore((state) => state.setPage);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const isRedirectingRef = useRef(false);

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
  const routeGuards = useRouteGuards(pathname);

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

  const MIN_LOADING_MS = 400;
  /**
   * Core navigation handler managing SPA transitions and cross-zone jumps.
   */
  const navigateTo = useCallback(
    async (page: IPage, options: NavigateOptions = {}) => {
      const { type = "push", savePage = true, event } = options;
      const isCrossZone = crossZoneCheck(page.path);
      const isExternalRoute = !isInRouteRegistry(page.path);

      if (event) event.preventDefault();

      if (isExternalRoute) {
        window.open(page.path, "_blank", "noopener,noreferrer");
        return;
      }

      if (drawerContent) closeDrawer();
      if (modalContent) closeModal();
      if (savePage && !isOnDoNotSave(page.path)) setLastPage(page);

      const startedAt = Date.now();

      if (isCrossZone) setIsCrossZoneLoading(true);
      else setIsSpaLoading(true);

      if (type === "push") router.push(page.path);
      if (type === "replace") router.replace(page.path);

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await delay(MIN_LOADING_MS - elapsed);
      }
    },
    [
      drawerContent,
      modalContent,
      closeDrawer,
      closeModal,
      setLastPage,
      setIsSpaLoading,
      setIsCrossZoneLoading,
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
      if (isRedirectingRef.current) return;

      const redirect = REDIRECT_MAP.find(({ guard }) => routeGuards[guard]);
      if (redirect) {
        if (redirect.target.path === pathname) return;
        isRedirectingRef.current = true;
        try {
          await navigateTo(redirect.target);
        } finally {
          isRedirectingRef.current = false;
        }
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
