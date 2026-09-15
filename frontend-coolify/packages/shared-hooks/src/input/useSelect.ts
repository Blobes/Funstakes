"use client";

import React, { useRef, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { MenuRef, useGlobalStore } from "@repo/core";

export interface SelectOptionItem {
  id?: string | number;
  value?: string | number;
  title?: React.ReactNode;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  [key: string]: unknown;
}

export interface UseSelectInputProps<
  T extends SelectOptionItem = SelectOptionItem,
> {
  options: T[];
  value?: string | number;
  selectedValue?: string | number;
  selectedValues?: (string | number)[];
  allowReset?: boolean;
  tooltipGuide?: React.ReactNode;
  onSelectChangeSingle?: (option: T) => void;
  onSelectChangeMultiple?: (selectedOptions: T[]) => void;
  onClear?: () => void;
}

/**
 * Custom hook to manage single and multiple select input state, selection logic, and menu interactions.
 */
export const useSelectInput = <T extends SelectOptionItem = SelectOptionItem>({
  options = [],
  value,
  selectedValue,
  selectedValues = [],
  allowReset = true,
  tooltipGuide,
  onSelectChangeMultiple,
  onClear,
}: UseSelectInputProps<T>) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<MenuRef>(null);
  const currLang = useGlobalStore((state) => state.currentLanguage);

  // Single Select Active Value Resolution
  const activeSingleValue = selectedValue ?? value;

  const selectedSingleOption = useMemo(() => {
    return options.find(
      (opt) => opt.value === activeSingleValue || opt.id === activeSingleValue,
    );
  }, [options, activeSingleValue]);

  const singleDisplayValue =
    (selectedSingleOption?.title as string) ||
    (selectedSingleOption?.label as string) ||
    (typeof value === "string" ? value : "");

  // Multiple Select Active Options Resolution
  const selectedMultipleOptions = useMemo(() => {
    return options.filter((opt) => {
      const hasValueMatch =
        opt.value !== undefined && selectedValues.includes(opt.value);
      const hasIdMatch =
        opt.id !== undefined && selectedValues.includes(opt.id);
      return hasValueMatch || hasIdMatch;
    });
  }, [options, selectedValues]);

  /**
   * Opens the overlay menu attached to the target element.
   */
  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    disabled?: boolean,
  ) => {
    if (disabled) return;
    const targetElement = inputRef.current || event.currentTarget;
    menuRef.current?.openMenu(targetElement);
  };

  /**
   * Resets single select active state and invokes clear handler.
   */
  const handleClearSingle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  /**
   * Resets multiple select active state and invokes clear handler.
   */
  const handleClearMultiple = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChangeMultiple?.([]);
    onClear?.();
  };

  /**
   * Toggles selection state for multiple selection mode.
   */
  const handleToggleMultipleItem = (item: T) => {
    const isSelected = selectedMultipleOptions.some(
      (opt) =>
        (opt.value !== undefined && opt.value === item.value) ||
        (opt.id !== undefined && opt.id === item.id),
    );

    let updated: T[];
    if (isSelected) {
      updated = selectedMultipleOptions.filter(
        (opt) => opt.value !== item.value && opt.id !== item.id,
      );
    } else {
      updated = [...selectedMultipleOptions, item];
    }
    onSelectChangeMultiple?.(updated);
  };

  /**
   * Removes a single option chip in multiple selection mode.
   */
  const handleRemoveChip = (item: T, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = selectedMultipleOptions.filter(
      (opt) => opt.value !== item.value && opt.id !== item.id,
    );
    onSelectChangeMultiple?.(updated);
  };

  const showSingleResetIcon = allowReset && Boolean(singleDisplayValue);
  const showSingleTooltip = tooltipGuide && !singleDisplayValue;

  const showMultipleResetIcon =
    allowReset && selectedMultipleOptions.length > 0;
  const showMultipleTooltip =
    tooltipGuide && selectedMultipleOptions.length === 0;

  return {
    theme,
    inputRef,
    menuRef,
    currLang,
    activeSingleValue,
    singleDisplayValue,
    selectedSingleOption,
    selectedMultipleOptions,
    showSingleResetIcon,
    showSingleTooltip,
    showMultipleResetIcon,
    showMultipleTooltip,
    handleOpenMenu,
    handleClearSingle,
    handleClearMultiple,
    handleToggleMultipleItem,
    handleRemoveChip,
  };
};
