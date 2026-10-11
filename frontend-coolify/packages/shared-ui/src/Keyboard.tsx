"use client";

import React, { useState, useMemo } from "react";
import { Box, IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { useGlobalStore } from "@repo/core";
import { Delete, Space, X, CornerDownLeft, Globe, ArrowUp } from "lucide-react";
import { TransText } from "./Text";
import { useVirtualKeyboard } from "@repo/shared-hooks";

const LATIN_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const ARABIC_NUMBERS = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "٠"];

const SYMBOLS_MATRIX = [
  ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
  ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
  [".", ",", "?", "!", "'", "_", "\\", "|", "~", "<", ">"],
];

const KEYBOARD_CONFIGS: Record<
  string,
  {
    label: string;
    matrix: string[][];
    uppercaseMatrix?: string[][];
    rtl?: boolean;
  }
> = {
  ar: {
    label: "لوحة مفاتيح عربية",
    rtl: true,
    matrix: [
      ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
      ["د", "ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك"],
      ["ط", "ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"],
    ],
  },
  ru: {
    label: "Русская раскладка",
    rtl: false,
    matrix: [
      ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
      ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
      ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "ё"],
    ],
    uppercaseMatrix: [
      ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
      ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
      ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю", "Ё"],
    ],
  },
  zh: {
    label: "中文键盘",
    rtl: false,
    matrix: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"],
    ],
  },
  ja: {
    label: "日本語 キーボード",
    rtl: false,
    matrix: [
      ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"],
      ["さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と"],
      ["な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ"],
      ["ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り"],
      ["る", "れ", "ろ", "わ", "を", "ん", "゛", "゜", "、", "。"],
    ],
  },
};

/**
 * Centralized standalone virtual keyboard component managed entirely via the global store.
 */
export const VirtualKeyboard = () => {
  const theme = useTheme();
  const currentLanguage = useGlobalStore((state) => state.currentLanguage);

  const [showSymbols, setShowSymbols] = useState<boolean>(false);
  const [isUppercase, setIsUppercase] = useState<boolean>(false);

  const {
    showKeyboard,
    setShowKeyboard,
    shouldUseVKeyboard: isSupportedLanguage,
    handleKeyInsert,
    handleBackspace,
    handleSpace,
    handleTabNavigation,
  } = useVirtualKeyboard();

  const currentConfig = useMemo(() => {
    return KEYBOARD_CONFIGS[currentLanguage || ""] || null;
  }, [currentLanguage]);

  const hasCaseVariants = useMemo(() => {
    return currentLanguage === "ru";
  }, [currentLanguage]);

  const activeMatrix = useMemo(() => {
    if (!currentConfig) return [];

    if (showSymbols) {
      // Numbers are contained exclusively inside the symbols layout matrix layer
      if (currentLanguage === "ar") {
        return [LATIN_NUMBERS, ARABIC_NUMBERS, ...SYMBOLS_MATRIX];
      }
      return [LATIN_NUMBERS, ...SYMBOLS_MATRIX];
    }

    // Letters layout matrix layer contains strictly character rows
    if (isUppercase && hasCaseVariants && currentConfig.uppercaseMatrix) {
      return currentConfig.uppercaseMatrix;
    }
    return currentConfig.matrix;
  }, [
    showSymbols,
    isUppercase,
    currentConfig,
    currentLanguage,
    hasCaseVariants,
  ]);

  if (!isSupportedLanguage || !showKeyboard || !currentConfig) return null;

  const sharedStyle = {
    color: theme.palette.gray[300],
    backgroundColor: theme.palette.gray.trans[1],
    borderRadius: theme.radius[8],
    height: 38,
    "&:hover": {
      backgroundColor: theme.palette.gray[50],
    },
  };

  return (
    <Box
      data-virtual-keyboard="true"
      dir={currentConfig.rtl && !showSymbols ? "rtl" : "ltr"}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      sx={{
        position: "fixed",
        bottom: theme.gap(4),
        ...(currentLanguage === "ar"
          ? { left: theme.gap(4) }
          : { right: theme.gap(4) }),
        zIndex: theme.zIndex?.modal || 1300,
        width: "calc(100% - 32px)",
        maxWidth: "460px",
        backgroundColor: theme.palette.gray[0],
        border: `1px solid ${theme.palette.gray.trans[1]}`,
        borderRadius: theme.radius[16],
        padding: theme.boxSpacing(4),
        boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.16)",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(2),
        [theme.breakpoints.down("md")]: {
          width: "100vw",
          bottom: 0,
          right: 0,
          borderRadius: 0,
          borderTop: `1px solid ${theme.palette.gray.trans[1]}`,
        },
      }}
    >
      <Stack
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: theme.boxSpacing(1) }}
      >
        <TransText
          sx={{
            ...theme.typography.text5,
            color: theme.palette.gray[200],
            fontWeight: 600,
          }}
        >
          {showSymbols ? "Symbols" : currentConfig.label}
        </TransText>
        <IconButton
          onClick={() => {
            setShowKeyboard(false);
            setShowSymbols(false);
            setIsUppercase(false);
          }}
          sx={{ backgroundColor: theme.palette.gray.trans[1], flex: "none" }}
        >
          <X size={18} />
        </IconButton>
      </Stack>

      {activeMatrix.map((row, rowIndex) => (
        <Stack
          key={rowIndex}
          style={{
            flexDirection: "row",
            gap: theme.gap(1.5),
            justifyContent: "center",
          }}
        >
          {row.map((char) => (
            <AppButton
              key={char}
              onClick={() => handleKeyInsert(char)}
              style={{
                minWidth: 10,
                fontSize: "14px",
                padding: theme.boxSpacing(1.5),
                width: "100%",
                ...sharedStyle,
              }}
            >
              {char}
            </AppButton>
          ))}
        </Stack>
      ))}

      <Stack flexDirection="row" gap={theme.gap(1.5)}>
        <AppButton
          onClick={() => setShowSymbols(!showSymbols)}
          style={{
            minWidth: 55,
            fontSize: "13px",
            fontWeight: 600,
            ...sharedStyle,
          }}
        >
          {showSymbols ? <Globe size={18} /> : "?12"}
        </AppButton>

        {hasCaseVariants && !showSymbols && (
          <AppButton
            onClick={() => setIsUppercase(!isUppercase)}
            style={{
              minWidth: 45,
              ...sharedStyle,
              backgroundColor: isUppercase
                ? theme.palette.gray[100]
                : theme.palette.gray.trans[1],
            }}
          >
            <ArrowUp size={22} />
          </AppButton>
        )}

        <AppButton
          onClick={handleSpace}
          style={{
            width: "100%",
            ...sharedStyle,
          }}
        >
          <Space size={28} />
        </AppButton>
        <AppButton
          onClick={handleBackspace}
          style={{
            ...sharedStyle,
          }}
        >
          <Delete size={24} />
        </AppButton>
        <AppButton
          onClick={handleTabNavigation}
          style={{
            ...sharedStyle,
          }}
        >
          <CornerDownLeft size={22} />
        </AppButton>
      </Stack>
    </Box>
  );
};
