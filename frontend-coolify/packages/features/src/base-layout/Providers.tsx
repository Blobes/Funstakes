"use client";

import { initializeLocalization, getBrowserLanguage } from "@repo/helpers";
import React, { useEffect, ReactNode, useRef } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n as I18nInstance } from "i18next";
import {
  GlobalThemeProvider,
  SUPPORTED_ISO_CODES,
  SupportedIsoCode,
  useGlobalStore,
  useSocketStore,
} from "@repo/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@repo/helpers";
import { PageLoaderUI } from "@repo/shared-ui";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useGlobalStore((state) => state.accessToken);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  useEffect(() => {
    if (accessToken) {
      initializeSocket(accessToken);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [accessToken, initializeSocket, disconnectSocket]);
  return <>{children}</>;
}

interface LanguageProviderProps {
  children: ReactNode;
}
/**
 * Client provider wrapping initialization loops and cross-mfe sync updates.
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const instanceRef = useRef<I18nInstance | null>(null);
  const instance = useGlobalStore((state) => state.i18nInstance);
  const setI18nInstance = useGlobalStore((state) => state.setI18nInstance);
  const setCurrentLanguage = useGlobalStore(
    (state) => state.setCurrentLanguage,
  );

  useEffect(() => {
    let isMounted = true;

    if (typeof window === "undefined") return;

    let targetLang = localStorage.getItem("app_lang");
    if (!targetLang) {
      targetLang = getBrowserLanguage();
      localStorage.setItem("app_lang", targetLang);
    }

    // Initialize isolated instance exactly once on mount
    initializeLocalization(
      targetLang as SupportedIsoCode,
      SUPPORTED_ISO_CODES,
    ).then((instance) => {
      if (!isMounted) return;
      instanceRef.current = instance;
      setI18nInstance(instance);
      setCurrentLanguage(instance.language as SupportedIsoCode);
    });

    return () => {
      isMounted = false;
    };
  }, [setI18nInstance, setCurrentLanguage]);

  useEffect(() => {
    const syncLanguage = (e: Event) => {
      const targetLang = (e as CustomEvent).detail;
      if (instanceRef.current && instanceRef.current.language !== targetLang) {
        instanceRef.current.changeLanguage(targetLang).then(() => {
          setCurrentLanguage(targetLang);
        });
      }
    };
    window.addEventListener("GLOBAL_LANG_CHANGED", syncLanguage);
    return () => {
      window.removeEventListener("GLOBAL_LANG_CHANGED", syncLanguage);
    };
  }, [setCurrentLanguage]);
  // Pass the initialized instance to I18nextProvider
  if (!instance) {
    return <PageLoaderUI />;
  }
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalThemeProvider>
        <LanguageProvider>
          <SocketProvider>{children}</SocketProvider>
        </LanguageProvider>
      </GlobalThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
