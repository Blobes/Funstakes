"use client";

import React, { ClipboardEvent, KeyboardEvent, ChangeEvent } from "react";
import { useTheme } from "@mui/material/styles";
import {
  FormHelperText,
  outlinedInputClasses,
  Stack,
  TextField,
} from "@mui/material";
import { AUTH_INPUT, GenericStyle } from "@repo/core";
import { TransText } from "../Text";
import {
  useOtpInputValidation,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { DisabledClickWrapper } from "../ElementTap";

export interface OtpInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  onDisabledClick?: () => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  disabled?: boolean;
  autoSubmit?: boolean;
  style?: GenericStyle;
}
/**
 * Renders a segmented OTP/verification code input using MUI TextField per cell.
 */
export const OtpInput = ({
  length = 6,
  onComplete,
  onChange,
  onDisabledClick,
  error = false,
  helperText: helperText,
  label,
  disabled = false,
  autoSubmit = true,
  style,
}: OtpInputProps) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  const {
    digits,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleFocus,
  } = useOtpInputValidation({
    length,
    autoSubmit,
    onChange,
    onComplete,
  });

  const tLabel = label ?? translateTxtString(AUTH_INPUT.label.enter_code);

  const renderInputField = () => (
    <Stack sx={{ flexDirection: "column", gap: theme.gap(4), ...style }}>
      {label && (
        <TransText
          sx={{
            ...theme.typography.text5,
            color: theme.palette.gray[200],
          }}
        >
          {tLabel}
        </TransText>
      )}
      <Stack sx={{ gap: theme.gap(3), flexDirection: "row" }}>
        {digits.map((digit, index) => (
          <TextField
            key={index}
            variant="outlined"
            size="small"
            value={digit}
            disabled={disabled}
            error={error}
            inputRef={(el) => {
              inputRefs.current[index] = el;
            }}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange(index, e)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(index, e)
            }
            onPaste={(e: ClipboardEvent<HTMLInputElement>) =>
              handlePaste(index, e)
            }
            onFocus={() => handleFocus(index)}
            slotProps={{
              input: {
                type: "tel",
                inputMode: "numeric",
                autoComplete: index === 0 ? "one-time-code" : "off",
              },
              htmlInput: {
                //  maxLength: 1,
                pattern: "[0-9]*",
                style: {
                  ...theme.typography.text2,
                  textAlign: "center",
                  fontWeight: 600,
                  width: "100%",
                  padding: 0,
                },
              },
            }}
            sx={{
              [`& .${outlinedInputClasses.root}`]: {
                width: style?.input.width || 44,
                height: 50,
                minWidth: 38,
                borderRadius: theme.radius[3],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: theme.boxSpacing(4),
              },
            }}
          />
        ))}
      </Stack>
      {helperText && (
        <FormHelperText error={error} sx={{ mx: 0 }}>
          <TransText noComponent>{helperText}</TransText>
        </FormHelperText>
      )}
    </Stack>
  );

  return disabled ? (
    <DisabledClickWrapper onClick={onDisabledClick}>
      {renderInputField()}
    </DisabledClickWrapper>
  ) : (
    renderInputField()
  );
};
