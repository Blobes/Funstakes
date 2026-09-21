"use client";

import { useCallback } from "react";
import { useSnackbar, usePage, useStaticTranslation } from "@repo/shared-hooks";
import {
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  IUser,
  STORAGE_KEYS,
  TransitData,
  useGlobalStore,
} from "@repo/core";
import { purgeCache, queryClient } from "@repo/helpers";

export interface FeedbackInput {
  identifier?: string;
  user?: IUser;
  accessToken?: string;
  onSuccessCallback?: () => void;
}

/**
 * Hook providing memoized handlers for authentication and account feedback operations.
 */
export interface FeedbackInput {
  identifier?: string;
  user?: IUser;
  accessToken?: string;
  onSuccessCallback?: () => void;
}

export const useFeedback = () => {
  const { setSBMessage } = useSnackbar();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);

  const handleAuthSuccess = useCallback(
    async (input: FeedbackInput) => {
      const { user, accessToken, onSuccessCallback } = input;
      setAccountStatus("ACTIVE");
      setAuthStatus("AUTHENTICATED");
      if (accessToken) setAccessToken(accessToken);

      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.verification_successful_tagline,
          ),
          msgStatus: "SUCCESS",
        },
      });

      if (user) {
        const userClone = { ...user };
        setAuthUser(userClone);
        if (!userClone.isOnboarded) {
          setAccountStatus("NOT_ONBOARDED");
          await navigateTo(CLIENT_ROUTES.onboarding);
          onSuccessCallback?.();
          return;
        }
      }
      await navigateTo(CLIENT_ROUTES.home, { type: "replace" });
      onSuccessCallback?.();
    },
    [
      setAuthUser,
      setAuthStatus,
      setSBMessage,
      translateTxtString,
      setAccountStatus,
      navigateTo,
      setAccessToken,
    ],
  );

  const handleAccountUpdateSuccess = useCallback(
    (input: FeedbackInput = {}) => {
      const { accessToken } = input;
      if (accessToken) setAccessToken(accessToken);

      purgeCache({
        queryClient,
        queryKeys: STORAGE_KEYS.ACCOUNT_UPDATE_TRANSIT,
      });

      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.security_details_updated_tagline,
          ),
          msgStatus: "SUCCESS",
        },
      });
      navigateTo(CLIENT_ROUTES.settings);
    },
    [setSBMessage, translateTxtString, navigateTo, setAccessToken],
  );

  const handlePassResetSuccess = useCallback(
    (input: FeedbackInput) => {
      const { identifier } = input;
      const transitData: TransitData<"PASSWORD_RESET"> = {
        transitId: "transit:otp-auth",
        purpose: "PASSWORD_RESET",
        payload: { nextStep: "NEW_PASSWORD", identifier },
      };
      queryClient.setQueryData(
        STORAGE_KEYS.PASS_RESET_FINALIZED_TRANSIT,
        transitData,
      );

      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.verification_successful_tagline,
          ),
          msgStatus: "SUCCESS",
        },
      });

      purgeCache({
        queryClient,
        queryKeys: STORAGE_KEYS.PASS_RESET_INIT_TRANSIT,
      });
      navigateTo(CLIENT_ROUTES.resetPassword, { type: "replace" });
    },
    [setSBMessage, translateTxtString, navigateTo],
  );

  const handleMfaActivationSuccess = useCallback(
    async (input: FeedbackInput = {}) => {
      const { onSuccessCallback } = input;
      setSBMessage({
        msg: {
          tagline: translateTxtString(AUTH_FEEDBACK.mfa_activated),
          msgStatus: "SUCCESS",
        },
      });

      await navigateTo(CLIENT_ROUTES.home, { type: "replace" });
      onSuccessCallback?.();
    },
    [setSBMessage, translateTxtString, navigateTo],
  );

  return {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  };
};
