"use client";

import React, { useRef } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  IconButton,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Stack,
} from "@mui/material";
import { ChevronDown, CircleQuestionMark, X } from "lucide-react";
import { ListType, MenuRef, useGlobalStore, IMenuItem } from "@repo/core";
import { DisplayList } from "../Menu";
import { BasicTooltip } from "../Tooltips";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

export interface SelectOption extends IMenuItem {
  value: string | number;
  [key: string]: unknown;
}

export interface SingleSelectInputProps extends InputProps, InputEventHandlers {
  options: SelectOption[];
  selectedValue?: string | number;
  onSelectChange?: (option: SelectOption) => void;
  listName?: ListType;
  showSearchBar?: boolean;
  isLoading?: boolean;
  multiline?: boolean;
}

/**
 * Single select component built on MUI Select integrated with DisplayList overlay menus.
 */
export const SingleSelectInput = ({
  variant = "outlined",
  id = "",
  value,
  selectedValue,
  placeholder = "Select an option...",
  label,
  helperText = "",
  tooltipGuide,
  allowReset = true,
  required = false,
  disabled = false,
  error = false,
  options = [],
  listName = ListType.DEFAULT,
  showSearchBar = false,
  isLoading = false,
  multiline = false,
  onSelectChange,
  onClear,
  onFocus,
  onBlur,
  onDisabledClick,
  style,
}: SingleSelectInputProps) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<MenuRef>(null);
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const activeValue = selectedValue ?? value;

  const selectedOption = options.find(
    (opt) => opt.value === activeValue || opt.id === activeValue,
  );

  const displayValue =
    selectedOption?.title || (typeof value === "string" ? value : "");

  /**
   * Triggers the DisplayList menu overlay anchored to the select element.
   */
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    if (inputRef.current) {
      menuRef.current?.openMenu(inputRef.current);
    } else {
      menuRef.current?.openMenu(event.currentTarget);
    }
  };

  /**
   * Resets selected state and triggers clear handler.
   */
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
  };

  const showResetIcon = allowReset && Boolean(displayValue);
  const showTooltip = tooltipGuide && !displayValue;

  const renderInputField = () => (
    <Box sx={{ position: "relative", width: "100%" }}>
      <FormControl
        fullWidth
        size="small"
        variant={variant}
        error={error}
        disabled={disabled}
        required={required}
        className="custom-select-form-style"
        sx={{}}
      >
        {label && <InputLabel htmlFor={id}>{label}</InputLabel>}
        <Select
          ref={inputRef}
          id={id}
          label={label}
          value={displayValue ? activeValue : ""}
          displayEmpty
          open={false}
          onClick={handleOpenMenu}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
          renderValue={(selected) => (selected ? displayValue : placeholder)}
          IconComponent={() => null}
          endAdornment={
            <InputAdornment position="end">
              <Stack
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.gap(1),
                }}
              >
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

                {showResetIcon ? (
                  <IconButton size="small" onClick={handleClearSelection}>
                    <X size={18} />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    aria-label="open options list"
                    sx={{
                      pointerEvents: "none",
                      color: theme.palette.gray[300],
                    }}
                  >
                    <ChevronDown size={18} />
                  </IconButton>
                )}
              </Stack>
            </InputAdornment>
          }
          sx={{
            fontWeight: 500,
            ...styleConfig({ theme, style, value: displayValue, currLang }),
            ...(multiline && {
              height: "auto",
              "& .MuiSelect-select": {
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.4,
                padding: theme.boxSpacing(2.5, 0),
              },
            }),
            ...style,
          }}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      <DisplayList<SelectOption>
        menuRef={menuRef}
        list={options}
        listName={listName}
        showSearchBar={showSearchBar}
        isLoading={isLoading}
        activeItem={displayValue}
        showActiveItem
        stickToScreen={false}
        heightThreshold={65}
        onItemClick={(item) => {
          if (onSelectChange && item) onSelectChange(item);
        }}
        style={{
          item: {
            padding: theme.boxSpacing(4, 6),
            borderRadius: theme.radius[2],
          },
          container: {
            width: inputRef.current ? inputRef.current.clientWidth : "100%",
            maxWidth: "unset",
          },
        }}
      />
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
