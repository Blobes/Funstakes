"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { processPhoneFormatting } from "@repo/helpers";
import { InputStatus, MenuRef } from "@repo/core";
import { useInputValidationMsg } from "./useValMsg";

export interface UsePhoneFieldOptions {
  initialValue?: string;
  isRequired?: boolean;
  includeCountryCode?: boolean;
  onClearFeedback?: () => void;
  onPhoneChange?: (value: string) => void;
}

/**
 * Manages validation, real-time formatting, country selector menus, and cursor alignment for phone input fields.
 */
export const usePhoneInputValidation = ({
  initialValue = "",
  isRequired = true,
  includeCountryCode = true,
  onClearFeedback,
  onPhoneChange,
}: UsePhoneFieldOptions = {}) => {
  const { getInputValidity } = useInputValidationMsg();
  const countryMenuRef = useRef<MenuRef>(null);
  const isCountrySelectedRef = useRef<boolean>(false);

  const [input, setInput] = useState(initialValue);
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");

  const rawValidity = getInputValidity(input);
  const isValidInput = rawValidity.status === "VALID";

  /**
   * Evaluates if phone field is empty or holds a valid phone number.
   */
  const isPhoneValid = useMemo(() => {
    return input === "" || isValidInput;
  }, [input, isValidInput]);

  /**
   * Synchronizes internal input state when external initialValue changes.
   */
  useEffect(() => {
    if (initialValue !== undefined) {
      setInput(initialValue);
    }
  }, [initialValue]);

  /**
   * Updates state, validates current input against phone validation rules, and propagates changes.
   */
  const validateAndSet = useCallback(
    (value: string) => {
      setInput(value);
      onPhoneChange?.(value);

      if (!isRequired && value === "") {
        setValidationMsg("");
        return;
      }

      const result = getInputValidity(value);
      setValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    },
    [getInputValidity, onPhoneChange],
  );

  /**
   * Processes phone input value updates across raw string payloads and native change events.
   */
  const handlePhoneChange = useCallback(
    (
      valueOrEvent:
        | string
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (typeof valueOrEvent === "string") {
        validateAndSet(valueOrEvent);
        return;
      }

      const target = valueOrEvent.target as HTMLInputElement;
      const nativeEvent = valueOrEvent.nativeEvent as InputEvent | undefined;
      const isDeleting = nativeEvent?.inputType === "deleteContentBackward";
      const start = target.selectionStart || 0;

      const result = processPhoneFormatting(
        target.value,
        start,
        isDeleting,
        includeCountryCode,
        isCountrySelectedRef.current,
      );

      if (result.shouldReset) {
        onClearFeedback?.();
        validateAndSet("");
        isCountrySelectedRef.current = false;
        return;
      }

      if (result.shouldOpenMenu) {
        countryMenuRef.current?.openMenu(target);
      }

      onClearFeedback?.();

      validateAndSet(result.nextVal);

      window.requestAnimationFrame(() => {
        if (target && document.activeElement === target) {
          target.setSelectionRange(result.nextCursor, result.nextCursor);
        }
      });
    },
    [includeCountryCode, onClearFeedback, validateAndSet],
  );

  /**
   * Clears phone input value, resets selection state, and clears validation feedback.
   */
  const handleClearPhone = useCallback(() => {
    setInput("");
    setValidity(undefined);
    setValidationMsg("");
    isCountrySelectedRef.current = false;
    onClearFeedback?.();
    onPhoneChange?.("");
  }, [onClearFeedback, onPhoneChange]);

  /**
   * Handles country menu closing when country selection is required.
   */
  const handleMenuClose = useCallback(() => {
    if (includeCountryCode && !isCountrySelectedRef.current) {
      handleClearPhone();
    }
  }, [includeCountryCode, handleClearPhone]);

  /**
   * Formats and sets phone prefix when a country item is selected from the menu.
   */
  const handleCountrySelect = useCallback(
    (countryCode: string) => {
      if (countryCode) {
        isCountrySelectedRef.current = true;
        const formattedPrefix = `(+${countryCode.replace(/\+/g, "")}) `;
        validateAndSet(formattedPrefix);
      }
    },
    [validateAndSet],
  );

  return {
    input,
    setInput,
    validity,
    validationMsg,
    isValidInput,
    isPhoneValid,
    countryMenuRef,
    isCountrySelectedRef,
    handlePhoneChange,
    handleClearPhone,
    handleMenuClose,
    handleCountrySelect,
    validateAndSet,
  };
};
