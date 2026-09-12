"use client";

import React, { useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { CircleQuestionMark, Keyboard, X } from "lucide-react";
import { ICountryItem, LISTS, ListType, useGlobalStore } from "@repo/core";
import { DisplayList as CountryList } from "../Menu";
import {
  usePhoneInputValidation,
  useVirtualKeyboard,
} from "@repo/shared-hooks";
import { BasicTooltip } from "../Tooltips";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

export interface PhoneInputProps extends InputProps, InputEventHandlers {
  includeCountryCode?: boolean;
  onPhoneChange: (value: string) => void;
  onClearInlineMsg?: () => void;
}
/**
 * Manages phone input strings, structural cursor alignment, and lazy-loaded contextual country lists.
 */
export const PhoneInput = ({
  variant = "outlined",
  id = "",
  value = "",
  placeholder = "e.g. +1234567890",
  label = "Phone Number",
  tooltipGuide,
  helperText = "",
  allowReset = true,
  required = false,
  disabled = false,
  error = false,
  includeCountryCode = true,
  onPhoneChange,
  onBlur,
  onFocus,
  onClearInlineMsg,
  onDisabledClick,
  style,
}: PhoneInputProps) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();
  const currLang = useGlobalStore((state) => state.currentLanguage);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    input,
    countryMenuRef,
    handlePhoneChange,
    handleClearPhone,
    handleMenuClose,
    handleCountrySelect,
  } = usePhoneInputValidation({
    initialValue: value,
    includeCountryCode,
    onClearFeedback: onClearInlineMsg,
    onPhoneChange,
  });

  const {
    showKeyboard,
    setShowKeyboard,
    shouldUseVKeyboard,
    registerAsActiveInput,
  } = useVirtualKeyboard(inputRef, handlePhoneChange, "phone-formatted");

  const displayValue = value !== undefined ? value : input;
  const showResetIcon = allowReset && value && value?.length > 0;
  const showTooltip = tooltipGuide && (!value || value?.length === 0);

  const renderInputField = () => (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        inputRef={inputRef}
        variant={variant}
        id={id}
        type="tel"
        inputMode="tel"
        value={displayValue}
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
            ...((showTooltip || showResetIcon || shouldUseVKeyboard) && {
              endAdornment: (
                <InputAdornment position="end">
                  {/* Virtual Keyboard */}
                  {shouldUseVKeyboard && (
                    <IconButton
                      onClick={() => {
                        registerAsActiveInput();
                        setShowKeyboard(!showKeyboard);
                      }}
                      size="small"
                      sx={{
                        ...(showKeyboard && {
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
                  {showTooltip && (
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
                    <IconButton onClick={handleClearPhone}>
                      <X size={18} />
                    </IconButton>
                  )}
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
        onChange={handlePhoneChange}
        onFocus={(e) => {
          registerAsActiveInput();
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          onBlur && onBlur(e);
        }}
      />

      {includeCountryCode && (
        <CountryList<ICountryItem>
          menuRef={countryMenuRef}
          list={COUNTRY_LIST}
          listName={ListType.COUNTRY}
          showSearchBar
          stickToScreen={false}
          heightThreshold={65}
          style={{
            item: {
              padding: theme.boxSpacing(4, 8),
              gap: "10px",
              borderRadius: 0,
              "& svg": { width: "16px", height: "16px" },
            },
            container: {
              padding: 0,
            },
          }}
          onMenuClose={handleMenuClose}
          onItemClick={(item) => {
            if (item?.code) {
              handleCountrySelect(item.code);
            }
          }}
        />
      )}
    </Box>
  );

  return disabled ? (
    <DisabledClickWrapper onClick={onDisabledClick}>
      {renderInputField()}
    </DisabledClickWrapper>
  ) : (
    renderInputField()
  );
};
