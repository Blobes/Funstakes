"use client";

import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import {
  ApiError,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  IUser,
  STORAGE_KEYS,
  useGlobalStore,
} from "@repo/core";
import { SignupResponse } from "../service";
import { useVerificationNavigation } from "@repo/features";
import { useCallback } from "react";

interface UseSignupFeedbackProps {
  email: string;
  signupMethod?: "INTERNAL" | "OAUTH";
}

/**
 * Handles post-registration state logic, global store state allocation, and navigation routing.
 */
export const useSignupFeedback = () => {
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const { handleVerificationNavigation } = useVerificationNavigation();
  const { translateTxtString } = useStaticTranslation();
  const { navigateTo } = usePage();

  /**
   * Caches credentials and routes user to validation views upon successful container generation.
   */
  const handleSignupSuccess = useCallback(
    async (res: SignupResponse, options: UseSignupFeedbackProps) => {
      const { email, signupMethod = "INTERNAL" } = options;

      if (res.httpStatus !== 200) return;

      const user = res.payload as IUser;
      if (res.status === "SUCCESS" && user) {
        setAccessToken(res.accessToken);
        setAuthStatus("AUTHENTICATED");

        if (signupMethod === "OAUTH") {
          setAuthUser(user);
          setAccountStatus("NOT_ONBOARDED");
          await navigateTo(CLIENT_ROUTES.onboarding);
        } else {
          setAccountStatus("NOT_VERIFIED");
          handleVerificationNavigation({
            user,
            identifier: user.email || email,
            identifierType: "EMAIL",
            otpMessageChannel: "EMAIL",
            reason: "NEW_ACCOUNT",
            purpose: "SIGNUP_VERIFICATION",
            verificationMethod: "MESSAGING",
            transitKey: STORAGE_KEYS.AUTH_TRANSIT,
            dispatchOnload: false,
          });
        }
        return;
      }
    },
    [
      setAccessToken,
      setAuthStatus,
      setAccountStatus,
      handleVerificationNavigation,
    ],
  );

  /**
   * Catches errors during registration and surfaces the rejection messages within the view container.
   */
  const handleSignupError = (
    error: ApiError,
    setMsg: React.Dispatch<React.SetStateAction<React.ReactNode | null>>,
  ) => {
    setMsg(
      error.localizedErrMsg ||
        translateTxtString(AUTH_FEEDBACK.registration_failed),
    );
  };

  return { handleSignupSuccess, handleSignupError };
};
