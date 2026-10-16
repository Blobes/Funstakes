"use client";

import React, { useMemo } from "react";
import { CircularProgress, Stack } from "@mui/material";
import { WordTrimmer, AppButton, TransText } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_BUTTON_LABELS,
  CACHE_KEYS,
  DynamicTranslateFns,
  BaseStyleObj,
  SUPPORTED_ISO_CODES,
  useGlobalStore,
} from "@repo/core";
import { useDynamicTranslation } from "@repo/shared-hooks";
import { getBrowserLanguage } from "@repo/helpers";

interface DynamicCaptionProps {
  captionId: string;
  caption: string;
  detectedLanguage?: string;
  transServiceFn: DynamicTranslateFns;
  style?: BaseStyleObj;
}

/**
 * Reusable layout wrapper providing instant inline translation actions for text contents.
 */
export const DynamicCaption: React.FC<DynamicCaptionProps> = ({
  captionId,
  caption,
  detectedLanguage = "en",
  transServiceFn,
  style = {},
}) => {
  const theme = useTheme();
  const userSelectedLanguage = useGlobalStore((state) => state.currentLanguage);
  const userPreferredLanguage = useGlobalStore((state) => state.authUser)
    ?.preferences?.preferredLanguage;
  const browserLanguage = getBrowserLanguage();

  const postSourceLang = detectedLanguage.toLowerCase();

  /**
   * Resolves the translation target language using a prioritized fallback resolution chain.
   */
  const targetLanguage = useMemo(() => {
    // 1. Profile Preference Fallback Layer
    if (userPreferredLanguage) {
      if (
        userPreferredLanguage !== postSourceLang &&
        SUPPORTED_ISO_CODES.includes(userPreferredLanguage)
      )
        return userPreferredLanguage;
    }

    // 2. Runtime UI Instance Selection Fallback Layer
    if (userSelectedLanguage) {
      if (
        userSelectedLanguage !== postSourceLang &&
        SUPPORTED_ISO_CODES.includes(userSelectedLanguage)
      )
        return userSelectedLanguage;
    }

    // 3. Client System Environment Configuration Baseline
    if (browserLanguage) {
      if (
        browserLanguage !== postSourceLang &&
        SUPPORTED_ISO_CODES.includes(browserLanguage)
      ) {
        return browserLanguage;
      }
    }

    return null;
  }, [
    userPreferredLanguage,
    userSelectedLanguage,
    browserLanguage,
    postSourceLang,
  ]);

  const needsTranslation = targetLanguage !== null;

  const {
    translatedText,
    isFetching,
    isError,
    showingTranslation,
    toggleTranslation,
  } = useDynamicTranslation({
    parentKey: CACHE_KEYS.POST.TRANSLATION,
    textData: {
      textId: captionId,
      textToTranslate: caption,
      sourceLang: postSourceLang,
      targetLang: targetLanguage ?? "en",
    },
    transCb: {
      translateServiceFn: transServiceFn.translateServiceFn,
      resolveTranslation: (res: any) =>
        res?.payload?.translatedText || res?.data?.translatedText,
    },
  });

  const visibleText =
    showingTranslation && translatedText ? translatedText : caption;

  const btnLabel = isError
    ? AUTH_BUTTON_LABELS.retry_translation
    : showingTranslation
      ? AUTH_BUTTON_LABELS.see_original
      : AUTH_BUTTON_LABELS.see_translation;

  return (
    <Stack sx={{ width: "100%", ...style }}>
      <WordTrimmer
        text={visibleText}
        style={{
          itemWrapper: {
            padding: theme.boxSpacing(4, 0),
            [theme.breakpoints.down("md")]: {
              padding: theme.boxSpacing(4, 6),
            },
          },
        }}
      />

      {needsTranslation && (
        <Stack direction="row" justifyContent="flex-start" sx={{ mt: 1 }}>
          <AppButton
            variant="text"
            size="x-small"
            onClick={toggleTranslation}
            style={{
              padding: 0,
              minWidth: "unset",
              width: "auto",
              "&:hover": { backgroundColor: "transparent" },
            }}
            options={{
              disabled: isFetching,
            }}
          >
            {isFetching ? (
              <>
                <CircularProgress size={12} color="inherit" sx={{ mr: 1 }} />
                Translating...
              </>
            ) : (
              <TransText {...btnLabel} noComponent />
            )}
          </AppButton>
        </Stack>
      )}
    </Stack>
  );
};
