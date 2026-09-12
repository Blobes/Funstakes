"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  useCachedData,
  useDynamicInputValidation,
  usePage,
  usePasswordInputValidation,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { useVerificationNavigation, usePopup } from "@repo/features";
import { delay, sanitizePhoneNumber, getCookie } from "@repo/helpers";
import {
  COMMON_FEEDBACK,
  ApiError,
  OtpMessageChannel,
  AUTH_FEEDBACK,
  TransitData,
  useGlobalStore,
  CLIENT_ROUTES,
  IUser,
  STORAGE_KEYS,
} from "@repo/core";
import { ResetPasswordService } from "./service";
import { ResetStepProps } from "../types";
import { CheckRequest, LoginService } from "../login/service";

/**
 * Orchestrates state management, validation, and mutations for password reset workflows.
 */
export const useReset = ({ existingInput, step, setStep }: ResetStepProps) => {
  const { initiateReset, setPassword } = ResetPasswordService();
  const {
    handleVerificationNavigation: handleOtpNavigation,
    checkTotpConfiguration,
    clearTemporarySession,
    timeLeft,
  } = useVerificationNavigation();
  const { translateTxtString } = useStaticTranslation();
  const { openPopup } = usePopup();
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const { navigateTo } = usePage();
  const { checkEmail, checkPhone } = LoginService();

  const [inlineMsg, setInlineMsg] = useState<React.ReactNode | null>(null);
  const [tempUser, setTempUser] = useState<IUser | null>(null);

  const transitData = useCachedData<TransitData<"PASSWORD_RESET">>(
    STORAGE_KEYS.PASS_RESET_FINALIZED_TRANSIT,
  );

  const resetTransitData = transitData?.[0];
  const transitNextStep = resetTransitData?.payload?.nextStep;
  const transitUserIdentifier = resetTransitData?.payload?.identifier;

  const hasTotp = checkTotpConfiguration(tempUser);

  /**
   * Resets active inline message state.
   */
  const clearInlineMsg = useCallback(() => {
    setInlineMsg(null);
  }, []);

  /**
   * Purges reset cookies, removes transit queries, and resets auth status.
   */
  const clearResetSession = useCallback(() => {
    clearTemporarySession({
      transitKey: STORAGE_KEYS.PASS_RESET_FINALIZED_TRANSIT,
    });
    if (step !== "CREDENTIAL") {
      setStep?.("CREDENTIAL");
    }
  }, [step, setStep, clearTemporarySession]);

  useEffect(() => {
    const resetSession = getCookie(STORAGE_KEYS.TEMPORARY_SESSION_KEY);
    if (!resetSession) {
      clearResetSession();
      return;
    }
    if (transitNextStep) setStep?.(transitNextStep);
  }, [transitNextStep, setStep, clearResetSession]);

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
    allowedTypes: ["EMAIL", "PHONE"],
    onClearFeedback: clearInlineMsg,
  });

  const {
    password,
    confirmPassword,
    confirmPassErrMsg,
    passwordVisualStates,
    isPasswordValid,
    handlePasswordChange,
    handleConfirmChange,
  } = usePasswordInputValidation();

  /**
   * Submits the updated password payload.
   */
  const { mutate: submitNewPassword, isPending: isNewPasswordLoading } =
    useMutation({
      mutationFn: async () => {
        await delay();

        return await setPassword({
          newPassword: password,
          identifier: transitUserIdentifier,
          purpose: "PASSWORD_RESET",
        });
      },
      onSuccess: (res) => {
        if (res.status === "SUCCESS") {
          clearResetSession();
          openPopup("RESET_PASSWORD_SUCCESS");
        }
      },
      onError: (error: ApiError) => {
        if (error.httpStatus !== 500 && error.httpStatus !== 0) {
          setInlineMsg(
            error.localizedErrMsg ||
              error.message ||
              translateTxtString(
                AUTH_FEEDBACK.password_reset_finalization_failed,
              ),
          );
          return;
        }
        setInlineMsg(
          error.localizedErrMsg ||
            translateTxtString(COMMON_FEEDBACK.server_error_tagline),
        );
      },
      onMutate: () => {
        clearInlineMsg();
      },
    });

  /**
   * Initiates password recovery process and fetches user account details.
   */
  const { mutate: executeOtpInitiate, isPending: isStandardLoading } =
    useMutation({
      mutationFn: async (val: string) => {
        await delay();
        const resolvedType = inputType ?? "UNKNOWN";
        const cleaned =
          resolvedType === "PHONE" ? sanitizePhoneNumber(val) : val;
        const isEmailReset = resolvedType === "EMAIL";

        const checkReq: CheckRequest = {
          identifier: cleaned,
          purpose: "PASSWORD_RESET",
        };

        const userData = isEmailReset
          ? await checkEmail(checkReq)
          : await checkPhone(checkReq);

        const isTotpConfigured = checkTotpConfiguration(userData);

        let initResetRes = null;
        const res = await initiateReset({
          identifier: cleaned,
          otpChannelType: isEmailReset ? "EMAIL" : "WHATSAPP",
          resetMethod: !isTotpConfigured ? "MESSAGING" : "TOTP",
        });
        if (res.status === "SUCCESS" && res.payload) {
          initResetRes = res;
        }

        return {
          initResetRes,
          userData,
          cleaned,
          isEmailReset,
        };
      },
      onSuccess: (data) => {
        if (!data || !data.userData) return;

        const { initResetRes, userData, cleaned, isEmailReset } = data;
        const user = userData.payload;
        const identifier = initResetRes?.payload?.identifier || cleaned;

        setAuthStatus("TEMPORARY");
        setTempUser(user);

        const isTotpConfigured = checkTotpConfiguration(user);

        const activeChannel: OtpMessageChannel = isEmailReset
          ? "EMAIL"
          : "WHATSAPP";

        handleOtpNavigation({
          user,
          identifier,
          identifierType:
            initResetRes?.payload?.identifierType ||
            (isEmailReset ? "EMAIL" : "PHONE_NUMBER"),
          otpMessageChannel: !isTotpConfigured ? activeChannel : undefined,
          verificationMethod: !isTotpConfigured ? "MESSAGING" : "TOTP",
          purpose: "PASSWORD_RESET",
          reason: "PASSWORD_RESET",
          transitKey: STORAGE_KEYS.PASS_RESET_INIT_TRANSIT,
          dispatchOnload: false,
        });
      },
      onError: (error: ApiError) => {
        if (error.httpStatus !== 500 && error.httpStatus !== 0) {
          setInlineMsg(
            error.localizedErrMsg ||
              error.message ||
              translateTxtString(
                AUTH_FEEDBACK.password_reset_initiation_failed,
              ),
          );
          return;
        }
        setInlineMsg(
          error.localizedErrMsg ||
            translateTxtString(COMMON_FEEDBACK.server_error_tagline),
        );
      },
      onMutate: () => {
        clearInlineMsg();
      },
    });

  /**
   * Handles form submit for identity recovery initiation.
   */
  const handleStandardSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;
    executeOtpInitiate(input);
  };

  /**
   * Routes user to TOTP verification if authenticator app is configured.
   */
  const handleTotpClick = useCallback(() => {
    if (!isValidInput || !input) return;
    if (!hasTotp || !tempUser) {
      setInlineMsg(
        translateTxtString(AUTH_FEEDBACK.authenticator_not_configured),
      );
      return;
    }
    handleOtpNavigation({
      user: tempUser,
      identifier: input,
      identifierType: inputType === "EMAIL" ? "EMAIL" : "PHONE_NUMBER",
      reason: "PASSWORD_RESET",
      purpose: "PASSWORD_RESET",
      verificationMethod: "TOTP",
      transitKey: STORAGE_KEYS.PASS_RESET_INIT_TRANSIT,
    });
    clearInlineMsg();
  }, [
    isValidInput,
    input,
    hasTotp,
    tempUser,
    inputType,
    handleOtpNavigation,
    clearInlineMsg,
    translateTxtString,
  ]);

  const passwordsMatch = password !== "" && password === confirmPassword;

  const isNewPasswordSubmitDisabled =
    isNewPasswordLoading ||
    !isPasswordValid ||
    !passwordsMatch ||
    timeLeft <= 0;

  /**
   * Handles form submit for setting a new password.
   */
  const handleNewPasswordSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isNewPasswordSubmitDisabled) return;
    submitNewPassword();
  };

  /**
   * Cancels reset workflow and cleans up local state.
   */
  const handleResetCancel = useCallback(() => {
    setInlineMsg(null);
    clearResetSession();
  }, [clearResetSession]);

  /**
   * Navigates user back to login route.
   */
  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      setInlineMsg(null);
      navigateTo(CLIENT_ROUTES.login, {
        event: e,
        loadPage: true,
        savePage: false,
      });
    },
    [navigateTo],
  );

  return {
    input,
    setInput,
    inputType,
    validity,
    validationMsg,
    inlineMsg,
    setInlineMsg,
    timeLeft,
    password,
    passwordVisualStates,
    isPasswordValid,
    confirmPassword,
    confirmPassErrMsg,
    isStandardLoading,
    isNewPasswordLoading,
    isResetInitSubmitDisabled:
      validity === "INVALID" || input === "" || isStandardLoading,
    isNewPasswordSubmitDisabled,
    countryMenuRef,
    handleChange,
    validateAndSet,
    handlePasswordChange,
    handleConfirmChange,
    handleStandardSubmit,
    handleTotpClick,
    hasTotp,
    handleNewPasswordSubmit,
    handleResetCancel,
    handleBack,
  };
};
