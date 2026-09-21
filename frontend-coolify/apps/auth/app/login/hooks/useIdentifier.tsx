"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDynamicInputValidation, usePage } from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { CheckRequest, LoginService } from "../service";
import { delay, getSavedIdentifier, sanitizePhoneNumber } from "@repo/helpers";
import { CLIENT_ROUTES, ApiError, GenericStyle } from "@repo/core";
import { useTheme } from "@mui/material/styles";
import { useLoginFeedback } from "./useFeedback";
import { LoginProps } from "../../types";

interface UseIdentifier extends LoginProps {
  inlineTxtStyle?: GenericStyle;
  handleResetPassClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
}

/**
 * Coordinates server verification and routing workflows based on user account status.
 */
export const useIdentifier = ({
  existingInput,
  setStep,
  setIdentifier,
  setInputType,
  inlineTxtStyle,
  handleResetPassClick,
}: UseIdentifier) => {
  const { checkEmail, checkPhone, checkUsername } = LoginService();
  const { navigateTo } = usePage();
  const theme = useTheme();
  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);

  const { handleCheckSuccess, handleCheckError } = useLoginFeedback({
    identifier: existingInput,
    setStep,
  });

  /**
   * Clears active inline error or feedback message.
   */
  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  /**
   * Handles user redirect to signup flow.
   */
  const handleSignupClick = useCallback(
    (e: React.MouseEvent) => {
      setInlineMsg(null);
      navigateTo(CLIENT_ROUTES.signup, { event: e });
    },
    [navigateTo],
  );

  const {
    input,
    setInput,
    inputType,
    validity,
    validationMsg,
    isValidInput,
    countryMenuRef,
    handleChange,
    validateAndSet,
  } = useDynamicInputValidation({
    initialValue: existingInput,
    onClearFeedback: clearInlineMsg,
  });

  // Syncs dynamic input type state upward whenever it changes during validation.
  useEffect(() => {
    if (inputType) setInputType?.(inputType);
  }, [inputType, setInputType]);

  // Autofills saved credential on mount if it exists in local storage.
  useEffect(() => {
    const savedIdentifier = getSavedIdentifier();
    if (input.length === 0 && savedIdentifier) setIdentifier?.(savedIdentifier);
  }, []);

  const { mutate, isPending: isAuthLoading } = useMutation({
    mutationFn: async (val: string) => {
      await delay();
      const resolvedType = inputType ?? "UNKNOWN";
      const cleaned = resolvedType === "PHONE" ? sanitizePhoneNumber(val) : val;
      const checkReq: CheckRequest = { identifier: cleaned, purpose: "LOGIN" };

      if (resolvedType === "EMAIL") return await checkEmail(checkReq);
      if (resolvedType === "PHONE") return await checkPhone(checkReq);
      return await checkUsername(checkReq);
    },
    onSuccess: (res) => {
      handleCheckSuccess({
        checkResponse: res,
        input,
        setStep,
        setIdentifier,
      });
    },
    onError: (error: ApiError) => {
      const resolvedType = inputType ?? "UNKNOWN";
      handleCheckError({
        error,
        resolvedType,
        setInlineMsg,
        handleSignupClick,
        handleResetPassClick,
        inlineTxtStyle,
        theme,
      });
    },
    onMutate: () => {
      clearInlineMsg();
    },
  });

  /**
   * Handles identifier form submission event.
   */
  const handleSubmit = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();
      if (!isValidInput || !input) return;
      mutate(input);
    },
    [isValidInput, input, mutate],
  );

  return {
    input,
    inputType,
    setInput,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled: validity === "INVALID" || input === "" || isAuthLoading,
    countryMenuRef,
    validateAndSet,
    handleSignupClick,
    inlineMsg,
  };
};
