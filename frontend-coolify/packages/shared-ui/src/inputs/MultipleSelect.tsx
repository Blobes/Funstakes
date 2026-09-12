"use client";

import React, { useRef, useMemo } from "react";
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
  Chip,
  Checkbox,
  Typography,
} from "@mui/material";
import { ChevronDown, CircleQuestionMark, X, Check } from "lucide-react";
import { ListType, MenuRef, useGlobalStore, IMenuItem } from "@repo/core";
import { DisplayList } from "../Menu";
import { BasicTooltip } from "../Tooltips";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

export interface SelectOption extends IMenuItem {
  value: string | number;
  icon?: React.ReactNode;
  [key: string]: unknown;
}

export type SelectedDisplayMode = "chips" | "text";
export type IndicatorType = "checkbox" | "check" | "none";

export interface MultipleSelectInputProps
  extends Omit<InputProps, "value">, InputEventHandlers {
  options: SelectOption[];
  selectedValues?: (string | number)[];
  onSelectChange?: (selectedOptions: SelectOption[]) => void;
  listName?: ListType;
  showSearchBar?: boolean;
  isLoading?: boolean;
  displayMode?: SelectedDisplayMode;
  indicatorType?: IndicatorType;
  showOptionIcons?: boolean;
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
  onSelectChange,
  onClear,
  onFocus,
  onBlur,
  onDisabledClick,
  style,
}: MultipleSelectInputProps) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<MenuRef>(null);
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const selectedOptions = useMemo(() => {
    return options.filter(
      (opt) =>
        selectedValues.includes(opt.value) || selectedValues.includes(opt.id),
    );
  }, [options, selectedValues]);

  /**
   * Triggers the DisplayList menu overlay anchored to the component.
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
   * Toggles item selection state.
   */
  const handleToggleItem = (item: SelectOption) => {
    const isSelected = selectedOptions.some(
      (opt) => opt.value === item.value || opt.id === item.id,
    );

    let updated: SelectOption[];
    if (isSelected) {
      updated = selectedOptions.filter(
        (opt) => opt.value !== item.value && opt.id !== item.id,
      );
    } else {
      updated = [...selectedOptions, item];
    }
    onSelectChange?.(updated);
  };

  /**
   * Removes a single option chip.
   */
  const handleRemoveChip = (e: React.MouseEvent, item: SelectOption) => {
    e.stopPropagation();
    const updated = selectedOptions.filter(
      (opt) => opt.value !== item.value && opt.id !== item.id,
    );
    onSelectChange?.(updated);
  };

  /**
   * Resets selected state and triggers clear handler.
   */
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChange?.([]);
    onClear?.();
  };

  const formattedOptions = useMemo(() => {
    return options.map((opt) => {
      const isSelected = selectedOptions.some(
        (selected) => selected.value === opt.value || selected.id === opt.id,
      );
      return {
        ...opt,
        element: (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            gap={theme.gap?.(2) || 1}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={theme.gap?.(2) || 1}
            >
              {indicatorType === "checkbox" && (
                <Checkbox
                  size="small"
                  checked={isSelected}
                  sx={{ padding: 0 }}
                />
              )}
              {showOptionIcons && opt.icon && (
                <Box display="flex" alignItems="center">
                  {opt.icon}
                </Box>
              )}
              <Typography variant="body2">{opt.title}</Typography>
            </Stack>

            {indicatorType === "check" && isSelected && (
              <Check size={16} color={theme.palette.primary.main} />
            )}
          </Stack>
        ),
      };
    });
  }, [options, selectedOptions, indicatorType, showOptionIcons, theme]);

  const showResetIcon = allowReset && selectedOptions.length > 0;
  const showTooltip = tooltipGuide && selectedOptions.length === 0;

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
          value={selectedOptions.map((opt) => opt.value)}
          displayEmpty
          open={false}
          onClick={handleOpenMenu}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
          renderValue={() => {
            if (selectedOptions.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary">
                  {placeholder}
                </Typography>
              );
            }

            if (displayMode === "chips") {
              return (
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {selectedOptions.map((opt) => (
                    <Chip
                      key={opt.id || opt.value}
                      label={opt.title}
                      size="small"
                      onDelete={(e) => handleRemoveChip(e, opt)}
                      deleteIcon={<X size={14} />}
                      sx={{ borderRadius: theme.radius?.[1] || 1 }}
                    />
                  ))}
                </Stack>
              );
            }

            return selectedOptions.map((opt) => opt.title).join(", ");
          }}
          IconComponent={() => null}
          endAdornment={
            <InputAdornment position="end">
              <Stack
                flexDirection="row"
                alignItems="center"
                gap={theme.gap?.(1) || 0.5}
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

                {showResetIcon && (
                  <IconButton size="small" onClick={handleClearAll}>
                    <X size={18} />
                  </IconButton>
                )}

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
              </Stack>
            </InputAdornment>
          }
          sx={{
            cursor: disabled ? "not-allowed" : "pointer",
            ...styleConfig({
              theme,
              style,
              value: selectedOptions.length ? "active" : "",
              currLang,
            }),
            ...style,
          }}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      <DisplayList<SelectOption>
        menuRef={menuRef}
        list={formattedOptions}
        listName={listName}
        showSearchBar={showSearchBar}
        isLoading={isLoading}
        stickToScreen={false}
        heightThreshold={65}
        style={{
          item: {
            padding: theme.boxSpacing(4, 6),
            borderRadius: theme.radius[1] || 0,
          },
          container: {
            width: inputRef.current ? inputRef.current.clientWidth : "100%",
          },
        }}
        onItemClick={(item) => {
          if (item) {
            handleToggleItem(item);
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
