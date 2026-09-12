"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { Eye, EyeClosed, Keyboard } from "lucide-react";
import { useGlobalStore } from "@repo/core";
import { useVirtualKeyboard } from "@repo/shared-hooks";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

// Password Input component for Validating Passwords
export const PasswordInput = ({
  variant = "outlined",
  id = "",
  value,
  placeholder = "Type here...",
  label = "Input Label",
  helperText = "",
  inputGuideUI,
  required = false,
  disabled = false,
  error = false,
  affixPosition = "end",
  onBlur,
  onChange,
  onFocus,
  onDisabledClick,
  style,
}: InputProps & InputEventHandlers) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const {
    showKeyboard,
    setShowKeyboard,
    shouldUseVKeyboard: isVirtualActive,
    registerAsActiveInput,
  } = useVirtualKeyboard(inputRef, onChange);

  const toggleShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const renderInputField = () => (
    <Stack gap={theme.gap(4)}>
      <TextField
        inputRef={inputRef}
        variant={variant}
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        label={label}
        helperText={helperText}
        required={required}
        disabled={disabled}
        error={error}
        size="small"
        fullWidth
        sx={{
          ...styleConfig({ theme, style, value, currLang }),
          ...style,
        }}
        slotProps={{
          input: {
            // Value Visibility Toggle Start Position
            ...(affixPosition === "start" && {
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    aria-label={
                      showPassword
                        ? "hide the password"
                        : "display the password"
                    }
                    onClick={toggleShowPassword}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    size="small"
                  >
                    {showPassword ? <Eye size={22} /> : <EyeClosed size={22} />}
                  </IconButton>
                </InputAdornment>
              ),
            }),

            endAdornment: (
              <InputAdornment
                position="end"
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.gap(0.2),
                }}
              >
                {/* Virtual Keyboard */}
                {isVirtualActive && (
                  <IconButton
                    onClick={() => {
                      registerAsActiveInput();
                      setShowKeyboard(!showKeyboard);
                    }}
                    size="small"
                    sx={{
                      ...(isVirtualActive &&
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

                {/* Password Visibility End Position */}
                <IconButton
                  aria-label={
                    showPassword ? "hide the password" : "display the password"
                  }
                  onClick={toggleShowPassword}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  size="small"
                >
                  {showPassword ? <Eye size={22} /> : <EyeClosed size={22} />}
                </IconButton>
              </InputAdornment>
            ),
          },
          htmlInput: {
            inputMode: isVirtualActive && showKeyboard ? "none" : "text",
          },
        }}
        onChange={(e) => onChange && onChange(e)}
        onFocus={(e) => {
          registerAsActiveInput();
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          onBlur && onBlur(e);
        }}
      />
      {inputGuideUI && inputGuideUI}
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
