"use client";

import React from "react";
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
import { ListType, IMenuItem } from "@repo/core";
import { DisplayList } from "../Menu";
import { BasicTooltip } from "../Tooltips";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";
import { useSelectInput } from "@repo/shared-hooks";

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
  const {
    theme,
    inputRef,
    menuRef,
    currLang,
    activeSingleValue,
    singleDisplayValue,
    showSingleResetIcon,
    showSingleTooltip,
    handleOpenMenu,
    handleClearSingle,
  } = useSelectInput<SelectOption>({
    options,
    value,
    selectedValue,
    allowReset,
    tooltipGuide,
    onClear,
  });

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
      >
        {label && <InputLabel htmlFor={id}>{label}</InputLabel>}
        <Select
          ref={inputRef}
          id={id}
          label={label}
          value={singleDisplayValue ? activeSingleValue : ""}
          displayEmpty
          open={false}
          onClick={(e) => handleOpenMenu(e, disabled)}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
          renderValue={(selected) =>
            selected ? singleDisplayValue : placeholder
          }
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
                {showSingleTooltip && (
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

                {showSingleResetIcon ? (
                  <IconButton size="small" onClick={handleClearSingle}>
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
            width: "100%",
            fontWeight: 500,
            ...styleConfig({
              theme,
              style,
              value: singleDisplayValue,
              currLang,
            }),
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
        activeItems={[singleDisplayValue]}
        displayActiveState
        heightThreshold={65}
        onItemClick={(item) => {
          if (onSelectChange && item) onSelectChange(item);
        }}
        style={{
          item: {
            padding: theme.boxSpacing(4, 6),
            borderRadius: theme.radius[2],
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
