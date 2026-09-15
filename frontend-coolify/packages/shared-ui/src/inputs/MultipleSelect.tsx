"use client";

import React, { useMemo } from "react";
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
import { ChevronDown, CircleQuestionMark, Check, X } from "lucide-react";
import { ListType, IMenuItem } from "@repo/core";
import { DisplayList } from "../Menu";
import { BasicTooltip } from "../Tooltips";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";
import { SelectOption } from "./SingleSelect";
import { ChoiceInput } from "./Choice";
import { AppChip } from "../Chip";
import { useSelectInput } from "@repo/shared-hooks";

export interface MultipleSelectOption extends IMenuItem, SelectOption {
  icon?: React.ReactNode;
}

export type SelectedDisplayMode = "chips" | "text";
export type IndicatorType = "checkbox" | "check" | "none";

export interface MultipleSelectInputProps
  extends Omit<InputProps, "value">, InputEventHandlers {
  options: MultipleSelectOption[];
  selectedValues?: (string | number)[];
  onSelectChange?: (selectedOptions: MultipleSelectOption[]) => void;
  listName?: ListType;
  showSearchBar?: boolean;
  isLoading?: boolean;
  displayMode?: SelectedDisplayMode;
  indicatorType?: IndicatorType;
  showOptionIcons?: boolean;
  multiline?: boolean;
  iconColor?: string;
}

/**
 * Multiple select input component built on MUI Select with chip and text display modes.
 */
export const MultipleSelectInput = ({
  variant = "outlined",
  id = "",
  selectedValues = [],
  placeholder = "Select options...",
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
  displayMode = "chips",
  indicatorType = "checkbox",
  showOptionIcons = true,
  multiline = false,
  iconColor,
  onSelectChange,
  onClear,
  onFocus,
  onBlur,
  onDisabledClick,
  style,
}: MultipleSelectInputProps) => {
  const {
    theme,
    inputRef,
    menuRef,
    currLang,
    selectedMultipleOptions,
    showMultipleResetIcon,
    showMultipleTooltip,
    handleOpenMenu,
    handleClearMultiple,
    handleToggleMultipleItem,
    handleRemoveChip,
  } = useSelectInput<MultipleSelectOption>({
    options,
    selectedValues,
    allowReset,
    tooltipGuide,
    onSelectChangeMultiple: onSelectChange,
    onClear,
  });

  /**
   * Formats options using standard IMenuItem list structures.
   */
  const formattedMultipleOptions = useMemo(() => {
    return options.map((opt) => {
      const isSelected = selectedMultipleOptions.some(
        (selected) =>
          (selected.value !== undefined && selected.value === opt.value) ||
          (selected.id !== undefined && selected.id === opt.id),
      );

      const displayTitle = (opt.title || opt.label || "") as string;
      const renderIcon = showOptionIcons && opt.icon;

      const isCheckbox = indicatorType === "checkbox";
      const isCheck = indicatorType === "check";

      const leadingElement = isCheckbox ? (
        <ChoiceInput choiceType="checkbox" checked={isSelected} />
      ) : renderIcon ? (
        opt.icon
      ) : null;

      const trailingElement = (
        <Stack
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            "& svg": {
              stroke: iconColor ?? theme.palette.gray[200],
            },
          }}
        >
          {isCheckbox && renderIcon && opt.icon}
          {isCheck && isSelected && (
            <Check size={16} style={{ stroke: theme.palette.gray[300] }} />
          )}
        </Stack>
      );

      return {
        ...opt,
        title: displayTitle,
        element: leadingElement,
        endElement: trailingElement,
      };
    });
  }, [options, selectedMultipleOptions, indicatorType, showOptionIcons, theme]);

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
          multiple
          label={label}
          value={selectedMultipleOptions.map((opt) => opt.value)}
          displayEmpty
          open={false}
          onClick={(e) => handleOpenMenu(e, disabled)}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
          renderValue={() => {
            if (selectedMultipleOptions.length === 0) return placeholder;

            if (displayMode === "chips") {
              return (
                <Stack
                  sx={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: theme.gap(1),
                  }}
                >
                  {selectedMultipleOptions.map((opt) => (
                    <AppChip
                      key={opt.id || opt.value}
                      label={(opt.title || opt.label || "") as React.ReactNode}
                      onRemove={() => handleRemoveChip(opt)}
                    />
                  ))}
                </Stack>
              );
            }

            return selectedMultipleOptions
              .map((opt) => String(opt.title || opt.label || ""))
              .join(", ");
          }}
          IconComponent={() => null}
          endAdornment={
            <InputAdornment
              position="end"
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: theme.gap(2),
                "& svg": {
                  stroke: theme.palette.gray[300],
                },
              }}
            >
              {showMultipleTooltip && (
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

              {showMultipleResetIcon ? (
                <IconButton size="small" onClick={handleClearMultiple}>
                  <X size={18} />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  aria-label="open options list"
                  sx={{
                    pointerEvents: "none",
                  }}
                >
                  <ChevronDown size={18} />
                </IconButton>
              )}
            </InputAdornment>
          }
          sx={{
            ...(multiline && {
              height: "auto",
              "& .MuiSelect-select": {
                whiteSpace: "normal !important",
                wordBreak: "break-word",
                lineHeight: 1.4,
                padding: theme.boxSpacing(2.5, 0),
              },
            }),
            ...styleConfig({
              theme,
              style,
              value: selectedMultipleOptions.length ? "active" : "",
              currLang,
            }),
            ...style,
          }}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      <DisplayList<MultipleSelectOption>
        menuRef={menuRef}
        list={formattedMultipleOptions}
        listName={listName}
        showSearchBar={showSearchBar}
        isLoading={isLoading}
        closeOnSelect={false}
        heightThreshold={65}
        activeItems={selectedValues}
        style={{
          item: {
            padding: theme.boxSpacing(5, 7),
            borderRadius: 0,
          },
          container: {
            gap: theme.gap(1),
            padding: theme.boxSpacing(0, 0, 8, 0),
          },
        }}
        onItemClick={(item) => {
          if (item) {
            const originalOption = options.find(
              (opt) => opt.id === item.id || opt.value === item.value,
            );
            handleToggleMultipleItem(originalOption || item);
          }
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
