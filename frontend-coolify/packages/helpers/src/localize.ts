"use client";

import i18n, { i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import { SUPPORTED_ISO_CODES, SupportedIsoCode } from "@repo/core";

/**
 * Generates an isolated i18n runtime context tailored for independent micro frontend spaces.
 */
export const initializeLocalization = async (
  language: SupportedIsoCode = "en",
  supportedLanguages: string[],
): Promise<I18nInstance> => {
  const instance = i18n.createInstance();

  const isDevelopment = process.env.NODE_ENV === "development";
  const CDN_HOST = process.env.NEXT_PUBLIC_CLOUDFLARE_UPLOAD_HOST;
  const DEV_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

  const loadPath = isDevelopment
    ? `/locale/versions/{{lng}}/{{ns}}.json?v=${DEV_VERSION || Date.now()}`
    : `${CDN_HOST}/locales/{{lng}}/{{ns}}.json?v=${DEV_VERSION || Date.now()}`;

  await instance
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: "en",
      ns: ["auth", "post", "apimessage", "common", "platform"],
      defaultNS: "common",
      supportedLngs: supportedLanguages,
      interpolation: {
        escapeValue: true,
      },
      backend: {
        loadPath,
      },
      react: {
        useSuspense: false,
      },
    });

  return instance;
};

/**
 * Extracts the primary language code directly from the browser's native settings configuration.
 */
export const getBrowserLanguage = (): SupportedIsoCode => {
  if (typeof window === "undefined") return "en";
  const browserLanguages = navigator.languages || [navigator.language];
  for (const lang of browserLanguages) {
    if (!lang) continue;
    const baseLang = lang.split("-")[0]?.toLowerCase() as SupportedIsoCode;
    if (baseLang && SUPPORTED_ISO_CODES.includes(baseLang)) {
      return baseLang;
    }
  }
  return "en";
};
