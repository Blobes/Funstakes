"use client";

import React, { useCallback } from "react";
import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import { clearLoginLock, getFromLocalStorage } from "@repo/helpers";
import {
  ApiError,
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  COMMON_FEEDBACK,
  CLIENT_ROUTES,
  IPage,
  IUser,
  GenericStyle,
  useGlobalStore,
  AuthStepName,
  IdentifierType,
} from "@repo/core";
import { useVerificationNavigation } from "@repo/features";
import { AnchorLink, TransText } from "@repo/shared-ui";
import { Theme } from "@mui/material/styles";
import { LoginResponse, CheckResponse } from "../service";
import { LoginProps } from "../../types";

export interface UseFeedbackProps {
  input?: string;
  identifierType?: IdentifierType;
  setStep?: (step: AuthStepName) => void;
  setIdentifier?: (identifier: string) => void;
  setInlineMsg?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  handleSignupClick?: (e: React.MouseEvent) => void;
  handleResetPassClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  loginResponse?: LoginResponse;
  checkResponse?: CheckResponse;
  inlineTxtStyle?: GenericStyle;
  theme?: Theme;
  error?: ApiError;
  resolvedType?: string;
  handleFailedAttempts?: () => void;
  setMsg?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
}

export const useLoginFeedback = ({ identifier, setStep }: LoginProps) => {
  const { navigateTo, isOnWeb } = usePage();
  const {
    handleVerificationNavigation: handleOtpNavigation,
    checkTotpConfiguration,
  } = useVerificationNavigation();
  const { translateTxtString } = useStaticTranslation();
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);

  /**
   * Processes successful login and routes based on account state.
   */
  const handleLoginSuccess = useCallback(
    async (feedbackProps: UseFeedbackProps) => {
      const { loginResponse, identifierType } = feedbackProps;

      if (loginResponse?.httpStatus !== 200) return;
      clearLoginLock();
      setGlobalLoading(true);

      const user = loginResponse.payload as IUser;
      if (loginResponse.status === "SUCCESS" && user) {
        setAccessToken(loginResponse.accessToken);

        const hasTotp = checkTotpConfiguration(user);
        const isEmail = identifierType === "EMAIL" && !hasTotp;

        if (loginResponse.requireOtp) {
          setAccountStatus("NOT_VERIFIED");

          handleOtpNavigation({
            user,
            identifier: user.email || user.phoneNumber || identifier,
            identifierType:
              identifierType === "EMAIL" ? "EMAIL" : "PHONE_NUMBER",
            purpose: "LOGIN_VERIFICATION",
            otpMessageChannel: isEmail ? "EMAIL" : "WHATSAPP",
            verificationMethod: hasTotp ? "TOTP" : "MESSAGING",
            reason: loginResponse.otpReason,
          });
          return;
        }

        setAuthUser(user);
        setAuthStatus("AUTHENTICATED");

        // Handling deactivated accounts immediately
        if (user.accountStatus === "DEACTIVATED") {
          setAccountStatus("DEACTIVATED");
          if (setStep) setStep("RESTORE_ACCOUNT");
          setGlobalLoading(false);
          return;
        }

        // Handling users who haven't completed onboarding steps
        if (!user.isOnboarded) {
          setAccountStatus("NOT_ONBOARDED");
          navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
          return;
        }

        // Finalizing redirect for fully verified and onboarded users
        const savedPage = getFromLocalStorage<IPage>();
        const destination =
          savedPage && !isOnWeb(savedPage.path)
            ? savedPage
            : CLIENT_ROUTES.home;
        navigateTo(destination, { loadPage: true });
      }
    },
    [
      setGlobalLoading,
      setAccessToken,
      setAccountStatus,
      identifier,
      handleOtpNavigation,
      setAuthUser,
      setAuthStatus,
      setStep,
      navigateTo,
      isOnWeb,
    ],
  );

  /**
   * Processes authentication failures and manages lockout messaging.
   */
  const handleLoginError = useCallback(
    (feedbackProps: UseFeedbackProps) => {
      const { error, handleFailedAttempts, setMsg } = feedbackProps;
      const isPasswordErr = error?.status === "UNAUTHORIZED";

      if (isPasswordErr) {
        handleFailedAttempts?.();
      } else {
        setMsg?.(
          error?.localizedErrMsg ||
            translateTxtString(AUTH_FEEDBACK.login_failed),
        );
      }
    },
    [translateTxtString],
  );

  /**
   * Processes successful identifier validation and updates step state.
   */
  const handleCheckSuccess = useCallback((feedbackProps: UseFeedbackProps) => {
    const { checkResponse: res, input, setStep, setIdentifier } = feedbackProps;
    if (res?.status === "SUCCESS") {
      if (res.payload?.accountStatus === "DEACTIVATED") {
        setStep?.("RESTORE_ACCOUNT");
        return;
      }
      if (res?.isExisting === true) {
        if (input) setIdentifier?.(input);
        setStep?.("PASSWORD");
      }
    }
  }, []);

  /**
   * Processes identifier verification failures and presents inline guidance messages.
   */
  const handleCheckError = useCallback(
    (feedbackProps: UseFeedbackProps) => {
      const {
        error,
        resolvedType,
        setInlineMsg,
        handleSignupClick,
        handleResetPassClick,
        inlineTxtStyle,
        theme,
      } = feedbackProps;

      const payload = error?.payload;

      if (error?.httpStatus === 404) {
        setInlineMsg?.(
          <span>
            <TransText
              {...(resolvedType === "PHONE"
                ? AUTH_FEEDBACK.no_account_found_phone
                : resolvedType === "EMAIL"
                  ? AUTH_FEEDBACK.no_account_found_email
                  : AUTH_FEEDBACK.no_account_found_username)}
              noComponent
            />
            {resolvedType === "EMAIL" && (
              <AnchorLink
                href={CLIENT_ROUTES.signup.path}
                onClick={handleSignupClick}
                style={{
                  marginLeft: theme?.gap(2),
                  ...inlineTxtStyle,
                  textDecoration: "underline",
                  color: theme?.palette.error.dark,
                }}
              >
                <TransText {...AUTH_BUTTON_LABELS.create_account} noComponent />
              </AnchorLink>
            )}
          </span>,
        );
        return;
      }

      if (error?.httpStatus === 403 && payload?.signedUpWith !== "EMAIL") {
        setInlineMsg?.(
          <span>
            {error.localizedErrMsg || error.message}
            <AnchorLink
              href={CLIENT_ROUTES.resetPassword.path}
              {...(handleResetPassClick && { onClick: handleResetPassClick })}
              style={{
                marginLeft: theme?.gap(2),
                ...inlineTxtStyle,
              }}
            >
              <TransText {...AUTH_BUTTON_LABELS.set_password} noComponent />
            </AnchorLink>
          </span>,
        );
        return;
      }
      setInlineMsg?.(
        error?.localizedErrMsg ||
          translateTxtString(COMMON_FEEDBACK.server_error_tagline),
      );
    },
    [translateTxtString],
  );

  return {
    handleLoginSuccess,
    handleLoginError,
    handleCheckSuccess,
    handleCheckError,
  };
};
