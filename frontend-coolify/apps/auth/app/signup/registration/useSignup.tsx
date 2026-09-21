"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  usePage,
  usePasswordInputValidation,
  useEmailInputValidation,
  usePhoneInputValidation,
} from "@repo/shared-hooks";
import { CLIENT_ROUTES, ApiError } from "@repo/core";
import { sanitizePhoneNumber } from "@repo/helpers";
import { SignupService } from "../service";
import { useSignupFeedback } from "./useFeedback";

/**
 * Coordinates form states, validation routines, and registration mutations for user account creation.
 */
export const useSignup = () => {
  const { createAccount } = SignupService();
  const { navigateTo } = usePage();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * Clears inline alert/feedback banners on form interaction.
   */
  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  const {
    email,
    emailValidity,
    emailValidationMsg,
    isEmailValid,
    handleEmailChange,
    handleClearEmail,
  } = useEmailInputValidation({
    onClearFeedback: clearInlineMsg,
  });

  const {
    input: phone,
    validity: phoneValidity,
    validationMsg: phoneValidationMsg,
    isPhoneValid,
    handlePhoneChange,
  } = usePhoneInputValidation({
    includeCountryCode: true,
    isRequired: false,
    onClearFeedback: clearInlineMsg,
  });

  const { handleSuccess, handleError } = useSignupFeedback({ email });

  const {
    password,
    passwordVisualStates,
    isPasswordValid,
    handlePasswordChange,
  } = usePasswordInputValidation();

  /**
   * TanStack Mutation handles server account provisioning.
   */
  const { mutate: executeSignup, isPending: isSignupPending } = useMutation({
    mutationFn: async () => {
      const cleanedPhone = phone ? sanitizePhoneNumber(phone) : undefined;
      return await createAccount({
        email: email.toLowerCase().trim(),
        password,
        phone: cleanedPhone,
      });
    },
    onSuccess: (res) => {
      setIsRedirecting(true);
      handleSuccess(res);
    },
    onError: (err: ApiError) => {
      setIsRedirecting(false);
      handleError(err, setInlineMsg);
    },
    onMutate: () => {
      clearInlineMsg();
    },
  });

  const isFormValid = useMemo(() => {
    return isEmailValid && isPasswordValid && isPhoneValid;
  }, [isEmailValid, isPasswordValid, isPhoneValid]);

  /**
   * Navigates user to login route.
   */
  const handleLoginClick = useCallback(
    (e: React.MouseEvent) => {
      clearInlineMsg();
      navigateTo(CLIENT_ROUTES.login, { event: e });
    },
    [navigateTo, clearInlineMsg],
  );

  /**
   * Validates form state and submits account registration request.
   */
  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    executeSignup();
  };

  return {
    email,
    phone,
    password,
    emailValidity,
    emailValidationMsg,
    phoneValidity,
    phoneValidationMsg,
    passwordVisualStates,
    isPasswordValid,
    handleEmailChange,
    handleClearEmail,
    handlePhoneChange,
    handlePasswordChange,
    handleSubmit,
    isSubmitLoading: isSignupPending || isRedirecting,
    isSubmitDisabled:
      !isFormValid ||
      isSignupPending ||
      emailValidity === "INVALID" ||
      phoneValidity === "INVALID",
    inlineMsg,
    handleLoginClick,
    clearInlineMsg,
  };
};
