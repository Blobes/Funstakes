"use client";

import React, { useRef } from "react";
import { Theme, useTheme } from "@mui/material/styles";
import {
  Box,
  IconButton,
  InputAdornment,
  inputLabelClasses,
  outlinedInputClasses,
  Stack,
  TextField,
} from "@mui/material";
import { CircleQuestionMark, Keyboard, X } from "lucide-react";
import { GenericStyle, SupportedIsoCode, useGlobalStore } from "@repo/core";

import {
  useDynamicInputValidation,
  useVirtualKeyboard,
} from "@repo/shared-hooks";
import { BasicTooltip } from "../Tooltips";
import { DisabledClickWrapper } from "../ElementTap";

export interface InputEventHandlers {
  onClick?: () => void;
  onChange?: (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onFocus?: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onBlur?: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onClear?: () => void;
  onDisabledClick?: () => void;
}

export interface InputProps {
  variant?: "outlined" | "filled";
  id?: string;
  type?: "text" | "number" | "email" | "search" | "password" | "tel";
  value?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  needsValidation?: boolean;
  inputGuideUI?: React.ReactNode;
  tooltipGuide?: React.ReactNode;
  allowReset?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  affix?: React.ReactNode;
  affixPosition?: "start" | "end";
  focusResizeWidth?: boolean;
  style?: GenericStyle;
}

interface SharedStyle {
  theme: Theme;
  style?: GenericStyle;
  value: any;
  currLang?: SupportedIsoCode;
}

export const styleConfig = (styleOptions: SharedStyle) => {
  const { style, theme, value, currLang } = styleOptions;
  const rtlLabel = {
    default: {
      right: 0,
      left: "unset",
      transform: "translate(-12px, 17px)",
    },
    focused: {
      right: 0,
      left: "unset",
      transform: "translate(0px, 7px) scale(0.83)",
    },
  };
  const input = {
    padding: theme.boxSpacing(7, 4, 2, 4),
  };

  return {
    [`& .${inputLabelClasses.root}`]: {
      ...(currLang === "ar" && rtlLabel.default),
    },
    [`& .${inputLabelClasses.root}.${inputLabelClasses.focused}, 
      & .${inputLabelClasses.root}.${inputLabelClasses.shrink}, 
      & .${inputLabelClasses.root}.${inputLabelClasses.error}`]: {
      ...(currLang === "ar" && rtlLabel.focused),
      ...style?.label,
    },
    [`& .${outlinedInputClasses.input}`]: {
      color: `${theme?.palette.gray[300]}`,
      ...input,
      ...style?.input,
    },
    [`& .${outlinedInputClasses.root}`]: {
      ...(value?.length > 0 && {
        ...input,
      }),
      ...style?.outline,
    },
    [`& .${outlinedInputClasses.focused}`]: {
      ...input,
      ...style?.outline?.focused,
    },
  };
};

export const DynamicInput = ({
  variant = "outlined",
  id = "",
  type = "text",
  value,
  placeholder = "Type here...",
  label,
  helperText = "",
  needsValidation,
  tooltipGuide,
  allowReset = true,
  required = false,
  disabled = false,
  readOnly = false,
  error = false,
  affix,
  affixPosition = "start",
  onClick,
  onChange,
  onFocus,
  onBlur,
  onClear,
  onDisabledClick,
  style,
}: InputProps & InputEventHandlers) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const { handleClear } = useDynamicInputValidation({
    needsValidation,
    initialValue: value,
    inputRef,
    onChange,
  });

  const resolveClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    handleClear();
  };

  const {
    showKeyboard,
    setShowKeyboard,
    shouldUseVKeyboard,
    registerAsActiveInput,
  } = useVirtualKeyboard(inputRef, onChange);

  const showResetIcon = allowReset && value && value?.length > 0;

  const renderInputField = () => (
    <TextField
      inputRef={inputRef}
      variant={variant}
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      label={label}
      helperText={helperText}
      required={required}
      disabled={disabled}
      error={error}
      size="small"
      fullWidth
      slotProps={{
        input: {
          readOnly,
          // Render the start surface only if explicitly targeted by affix configuration
          ...(affix &&
            affixPosition === "start" && {
              startAdornment: (
                <InputAdornment position="start">{affix}</InputAdornment>
              ),
            }),

          // Consolidated end surface wrapper to handle overlaps seamlessly
          ...((showResetIcon ||
            affix ||
            shouldUseVKeyboard ||
            tooltipGuide) && {
            endAdornment: (
              <InputAdornment position="end">
                <Stack
                  flexDirection="row"
                  alignItems="center"
                  gap={theme.gap?.(1) || 0.5}
                >
                  {/* Virtual keyboard */}
                  {shouldUseVKeyboard && (
                    <IconButton
                      onClick={() => {
                        registerAsActiveInput();
                        setShowKeyboard(!showKeyboard);
                      }}
                      size="small"
                      sx={{
                        ...(shouldUseVKeyboard &&
                          showKeyboard && {
                            backgroundColor: theme.palette.gray.trans[1],
                            "& svg": {
                              stroke: theme.palette.primary.dark,
                            },
                          }),
                      }}
                    >
                      <Keyboard size={18} />
                    </IconButton>
                  )}

                  {/* Tooltip Guide */}
                  {tooltipGuide && (!value || value?.length === 0) && (
                    <BasicTooltip title={tooltipGuide}>
                      <Box
                        sx={{
                          display: "flex",
                          cursor: "pointer",
                          borderRadius: theme.radius.full,
                          alignSelf: "center",
                          flex: "none",
                          padding: theme.boxSpacing(1),
                          "&:hover": {
                            backgroundColor: theme.palette.gray.trans[1],
                          },
                        }}
                      >
                        <CircleQuestionMark size={18} />
                      </Box>
                    </BasicTooltip>
                  )}

                  {/* Clear field value */}
                  {showResetIcon && (
                    <IconButton onClick={resolveClear}>
                      <X size={18} />
                    </IconButton>
                  )}

                  {/* Dynamic Affix */}
                  {affix && affixPosition === "end" && affix}
                </Stack>
              </InputAdornment>
            ),
          }),
        },
        htmlInput: {
          inputMode: shouldUseVKeyboard && showKeyboard ? "none" : "text",
        },
      }}
      sx={{
        ...styleConfig({ theme, style, value, currLang }),
        ...style,
      }}
      onClick={() => onClick && onClick()}
      onChange={(e) => onChange && onChange(e)}
      onFocus={(e) => {
        registerAsActiveInput();
        onFocus && onFocus(e);
      }}
      onBlur={(e) => {
        onBlur && onBlur(e);
      }}
    />
  );

  return disabled ? (
    <DisabledClickWrapper onClick={onDisabledClick}>
      {renderInputField()}
    </DisabledClickWrapper>
  ) : (
    renderInputField()
  );
};
