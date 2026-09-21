"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  clearSavedPassword,
  delay,
  formatRemainingTime,
  getSavedPassword,
  saveIdentifier,
  savePassword,
} from "@repo/helpers";
import { ApiError, CLIENT_ROUTES, IdentifierType } from "@repo/core";
import { LoginService } from "../service";
import { useLoginFeedback } from "./useFeedback";
import { usePage, usePasswordInputValidation } from "@repo/shared-hooks";
import { TransText } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { LoginProps } from "../../types";

/**
 * Coordinates user login mutation state and handles feedback delegation.
 */
export const useLogin = ({ identifier, setStep, inputType }: LoginProps) => {
  const { login } = LoginService();
  const { navigateTo } = usePage();
  const { handleLoginSuccess, handleLoginError } = useLoginFeedback({
    identifier,
    setStep,
  });
  const theme = useTheme();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return Boolean(getSavedPassword());
  });

  const inlineMsgStyle = useMemo(
    () => ({
      color: theme.palette.error.dark,
      fontWeight: 700,
      margin: theme.boxSpacing(0, 1),
    }),
    [theme],
  );

  const passwordValidation = usePasswordInputValidation({
    mode: "AUTHENTICATE",
  });
  const {
    password,
    handlePasswordChange,
    setPassword,
    isLocked,
    remainingSec,
    inlineMsg,
    setInlineMsg,
    attemptFeedback,
    errorMsg,
    passwordValidity,
    handleFailedAttempts,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
  } = passwordValidation;

  // Autofills saved password on mount if it exists in local storage.
  useEffect(() => {
    const savedPassword = getSavedPassword();
    if (password.length === 0 && savedPassword) setPassword(savedPassword);
  }, []);

  // Syncs attempt error descriptor objects into UI translation component tree.
  useEffect(() => {
    if (!attemptFeedback) return;

    setInlineMsg(
      <TransText
        {...attemptFeedback.feedbackConfig}
        inlineComponents={{ counter: <strong style={inlineMsgStyle} /> }}
        sx={{ ...theme.typography.text5 }}
      />,
    );
  }, [attemptFeedback, inlineMsgStyle, setInlineMsg, theme.typography.text5]);

  /**
   * Navigates user to reset password page.
   */
  const handleResetPassClick = useCallback(
    (e: React.MouseEvent) => {
      setInlineMsg(null);
      navigateTo(CLIENT_ROUTES.resetPassword, { event: e });
    },
    [navigateTo, setInlineMsg],
  );

  /**
   * Handles remember me toggle switch state.
   */
  const handleRememberMe = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setRememberMe(checked);
    },
    [],
  );

  /**
   * Executes authentication mutation request.
   */
  const { mutate: executeLogin, isPending: isMutationLoading } = useMutation({
    mutationFn: async () => {
      if (!identifier) return;
      await delay();
      return await login({ identifier, password });
    },
    onSuccess: (res) => {
      setIsRedirecting(true);
      if (identifier) saveIdentifier(identifier);
      if (rememberMe) {
        savePassword(password);
      } else {
        clearSavedPassword();
      }
      if (res) {
        const identifierType: IdentifierType =
          inputType === "PHONE" ? "PHONE_NUMBER" : "EMAIL";
        handleLoginSuccess({ loginResponse: res, identifierType });
      }
    },
    onError: (err: ApiError) => {
      setIsRedirecting(false);
      handleLoginError({
        error: err,
        handleFailedAttempts,
        setMsg: setInlineMsg,
      });
    },
  });

  /**
   * Handles authentication form submission event.
   */
  const handleSubmit = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();
      if (isLocked) return;
      executeLogin();
    },
    [isLocked, executeLogin],
  );

  return {
    password,
    passwordValidity,
    handlePasswordChange,
    handleResetPassClick,
    handleSubmit,
    isLocked,
    remainingSec,
    formattedSec: formatRemainingTime(remainingSec),
    isAuthLoading: isMutationLoading || isRedirecting,
    inlineMsg,
    inlineMsgStyle,
    setInlineMsg,
    errorMsg,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
    rememberMe,
    handleRememberMe,
  };
};
