"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Drawer,
  Modal,
  SnackBars,
  PageLoaderUI,
  OfflinePromptUI,
  NetworkGlitchUI,
  VirtualKeyboard,
  SplashUI,
  ProgressUI,
} from "@repo/shared-ui";
import { usePathname } from "next/navigation";
import { registerSW, delay, getFromLocalStorage } from "@repo/helpers";
import {
  useEventListener,
  useMisc,
  useOffline,
  usePage,
  useSnackbar,
} from "@repo/shared-hooks";
import { AuthStatus, OverlayRef, useGlobalStore } from "@repo/core";
import { useAuthVerification } from "../apps/auth/session/useAuthVerification";

export interface UIManagerProps {
  children: React.ReactNode;
  includesOfflineUI?: boolean;
  includesNetworkErrorUI?: boolean;
}

/** * Manages the global UI state, including modals, drawers, snackbars, and system-level screens.
 * Orchestrates the initial app boot sequence.
 */
export const GlobalUIManager = ({
  children,
  includesOfflineUI = true,
  includesNetworkErrorUI = true,
}: UIManagerProps) => {
  const snackBarMsg = useGlobalStore((state) => state.snackBarMsgs);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const isSpaLoading = useGlobalStore((state) => state.isSpaLoading);
  const setIsSpaLoading = useGlobalStore((state) => state.setIsSpaLoading);
  const authStatus = useGlobalStore((state) => state.authStatus);
  const networkStatus = useGlobalStore((state) => state.networkStatus);
  const offlineMode = useGlobalStore((state) => state.offlineMode);
  const checkingSignal = useGlobalStore((state) => state.checkingSignal);
  const accountStatus = useGlobalStore((state) => state.accountStatus);
  const isCrossZoneLoading = useGlobalStore(
    (state) => state.isCrossZoneLoading,
  );
  const setIsCrossZoneLoading = useGlobalStore(
    (state) => state.setIsCrossZoneLoading,
  );

  const { verifySignal, isUnstableNetwork, isOffline } = useMisc();
  const { handlePageChange } = usePage();
  const pathname = usePathname();
  const { verifyAuth, isVerifyingAuth } = useAuthVerification();
  const { setSBTimer, removeSBMessages } = useSnackbar();
  const { switchToOfflineMode } = useOffline();

  const drawerRef = useRef<OverlayRef>(null);
  const modalRef = useRef<OverlayRef>(null);

  // Tracks whether a browser reload occurred.
  const [isReload, setIsReload] = useState(false);
  const [isSplashTimerDone, setIsSplashTimerDone] = useState(false);
  const SPLASH_DURATION = 4000;

  // Registering global events on mount
  useEventListener(verifyAuth);

  // Detects browser refresh and controls splash visibility duration.
  useEffect(() => {
    let isMounted = true;
    const handleSplashDelay = async () => {
      const navEntries = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      const reloaded =
        navEntries.length > 0 && navEntries[0]?.type === "reload";

      if (reloaded) {
        setIsReload(true);
        await delay(SPLASH_DURATION);
        if (isMounted) {
          setIsSplashTimerDone(true);
        }
      }
    };
    handleSplashDelay();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handles the application initialization sequence.
  useEffect(() => {
    const init = async () => {
      registerSW();
      await verifySignal();
      await verifyAuth();
    };
    init();
  }, []); // verifyAuth, verifySignal

  // Runs heart-beat update for time-dependent state.
  useEffect(() => {
    const heartbeat = setInterval(() => {
      useGlobalStore.getState().updateNow();
    }, 60000);
    return () => clearInterval(heartbeat);
  }, []);

  // Syncs the local refs for Drawer & Modal overlays with the global Zustand state.
  useEffect(() => {
    if (drawerContent) {
      drawerRef.current?.openOverlay();
    }
  }, [drawerContent]);
  useEffect(() => {
    if (modalContent) {
      modalRef.current?.openOverlay();
    }
  }, [modalContent]);

  // Responds to route changes, tracking and act as route guard.
  useEffect(() => {
    handlePageChange();
  }, [pathname, authStatus, accountStatus]);

  // Clear pending loading pages only after the URL actually changed
  useEffect(() => {
    setIsCrossZoneLoading(false);
    setIsSpaLoading(false);
  }, [pathname, setIsCrossZoneLoading, setIsSpaLoading]);

  const isAuthInitializing =
    isVerifyingAuth || authStatus === "LOADING" || networkStatus === "UNKNOWN";

  // Determines if splash should remain active on reload until auth/boot finishes.
  const showSplashUI = isReload && (!isSplashTimerDone || isAuthInitializing);
  if (showSplashUI) return <SplashUI />;

  // Determining if the app is still in its initial boot state
  const showLoaderUI = isCrossZoneLoading || isAuthInitializing;
  if (showLoaderUI) return <PageLoaderUI />;

  const savedLoginStatus = getFromLocalStorage<AuthStatus>({
    key: "last_auth_status",
  });
  const wasLoggedIn = savedLoginStatus === "AUTHENTICATED";
  const showOffline =
    includesOfflineUI && isOffline && !offlineMode && wasLoggedIn;
  if (showOffline) {
    return <OfflinePromptUI handleOffline={switchToOfflineMode} />;
  }

  // Logic for displaying Network Glitches or Critical Auth Errors
  const hasNetworkGlitch = isUnstableNetwork && !isOffline;
  const hasServerError = authStatus === "ERROR";
  const isGuestOffline = isOffline && !wasLoggedIn;

  const showNetworkGlitchUI =
    includesNetworkErrorUI &&
    (hasNetworkGlitch || hasServerError || isGuestOffline);

  if (showNetworkGlitchUI) {
    return (
      <NetworkGlitchUI
        checkingSignal={checkingSignal}
        isUnstableNetwork={isUnstableNetwork}
        isServerError={hasServerError}
      />
    );
  }

  // Main UI rendering with portal-like overlays
  return (
    <>
      {isSpaLoading && (
        <ProgressUI
          type="linear"
          style={{
            container: {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: 4,
              borderRadius: 0,
            },
          }}
        />
      )}
      {children}
      {snackBarMsg.messages && snackBarMsg.messages.length > 0 && (
        <SnackBars
          snackBarMsg={snackBarMsg}
          removeMessage={removeSBMessages}
          setSBTimer={setSBTimer}
        />
      )}
      {drawerContent && <Drawer ref={drawerRef} {...drawerContent} />}
      {modalContent && <Modal ref={modalRef} {...modalContent} />}
      {/* Virtual keyboard */}
      <VirtualKeyboard />
    </>
  );
};
