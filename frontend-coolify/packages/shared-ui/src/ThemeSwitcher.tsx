"use client";

import React from "react";
import { useColorScheme, useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { MoonStar, Sun } from "lucide-react";
import { TransText } from "./Text";
import { ChoiceInput } from "./inputs/Choice";

/**
 * Renders theme toggle using ChoiceInput switch configuration.
 */
export const ThemeSwitcher: React.FC = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const theme = useTheme();
  const effectiveMode = mode === "system" ? (systemMode ?? "dark") : mode;

  const handleModeToggle = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setMode(checked ? "dark" : "light");
  };

  const isDark = effectiveMode === "dark";

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ width: "100%" }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: theme.gap(10),
          "& svg": { width: "22px", height: "22px" },
        }}
      >
        {isDark ? <MoonStar /> : <Sun />}
        <TransText sx={{ ...theme.typography.text3, fontWeight: "600" }}>
          {isDark ? "Dark theme" : "Light theme"}
        </TransText>
      </Stack>

      <ChoiceInput
        choiceType="switch"
        checked={isDark}
        onChoiceChange={handleModeToggle}
        switchIcon={<Sun />}
        switchCheckedIcon={<MoonStar />}
      />
    </Stack>
  );
};
