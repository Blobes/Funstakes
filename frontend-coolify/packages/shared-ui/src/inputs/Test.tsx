"use client";

import React, { useState, useCallback } from "react";
import { Stack, Typography, Box, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Shield, Key, Lock, HelpCircle } from "lucide-react";
import {
  IndicatorType,
  MultipleSelectInput,
  MultipleSelectOption,
  SelectedDisplayMode,
} from "./MultipleSelect";
import { AppButton } from "../Buttons";

const MOCK_SECURITY_QUESTIONS: MultipleSelectOption[] = [
  {
    id: "q1",
    value: "q1",
    title: "What was the name of your first pet?",
    icon: <Shield size={16} />,
  },
  {
    id: "q2",
    value: "q2",
    title: "What is your mother's maiden name?",
    icon: <Key size={16} />,
  },
  {
    id: "q3",
    value: "q3",
    title: "What city were you born in?",
    icon: <Lock size={16} />,
  },
  {
    id: "q4",
    value: "q4",
    title: "What was the make of your first car?",
    icon: <HelpCircle size={16} />,
  },
];

/**
 * Isolated sandbox view for verifying MultipleSelectInput behaviors and props.
 */
export const TestMultipleSelectSandbox = () => {
  const theme = useTheme();
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>([
    "q1",
  ]);
  const [displayMode, setDisplayMode] = useState<SelectedDisplayMode>("chips");
  const [indicatorType, setIndicatorType] = useState<IndicatorType>("checkbox");
  const [isDisabled, setIsDisabled] = useState(false);

  /**
   * Updates selected state when items are checked or unchecked.
   */
  const handleSelectChange = useCallback(
    (selectedOptions: MultipleSelectOption[]) => {
      const nextValues = selectedOptions.map((opt) => opt.value ?? opt.id);
      setSelectedValues(nextValues as (string | number)[]);
    },
    [],
  );

  /**
   * Clears current selection state array.
   */
  const handleClear = useCallback(() => {
    setSelectedValues([]);
  }, []);

  /**
   * Toggles display mode between chips and delimited text string.
   */
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => (prev === "chips" ? "text" : "chips"));
  }, []);

  /**
   * Cycles indicator types across checkbox, check mark, and none.
   */
  const cycleIndicatorType = useCallback(() => {
    setIndicatorType((prev) => {
      if (prev === "checkbox") return "check";
      if (prev === "check") return "none";
      return "checkbox";
    });
  }, []);

  return (
    <Stack sx={{ gap: theme.gap(16), p: theme.boxSpacing(6), maxWidth: 600 }}>
      <Typography variant="h6">MultipleSelectInput Sandbox</Typography>

      <MultipleSelectInput
        label="Test Security Questions"
        placeholder="Choose questions..."
        options={MOCK_SECURITY_QUESTIONS}
        selectedValues={selectedValues}
        onSelectChange={handleSelectChange}
        onClear={handleClear}
        displayMode={displayMode}
        indicatorType={indicatorType}
        disabled={isDisabled}
        showSearchBar
        multiline
        allowReset
      />

      <Divider />

      <Stack gap={theme.gap(8)}>
        <Typography variant="subtitle2">Interactive Controls</Typography>
        <Stack direction="row" gap={theme.gap(4)} flexWrap="wrap">
          <AppButton
            variant="outlined"
            size="small"
            onClick={toggleDisplayMode}
          >
            Mode: {displayMode}
          </AppButton>
          <AppButton
            variant="outlined"
            size="small"
            onClick={cycleIndicatorType}
          >
            Indicator: {indicatorType}
          </AppButton>
          <AppButton
            variant="outlined"
            size="small"
            onClick={() => setIsDisabled((prev) => !prev)}
          >
            Toggle Disabled ({isDisabled ? "True" : "False"})
          </AppButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          p: theme.boxSpacing(4),
          backgroundColor: theme.palette.gray.trans[1],
          borderRadius: theme.radius[2],
        }}
      >
        <Typography variant="caption" display="block">
          Selected Raw Values:
        </Typography>
        <Typography variant="body2" component="pre">
          {JSON.stringify(selectedValues, null, 2)}
        </Typography>
      </Box>
    </Stack>
  );
};
