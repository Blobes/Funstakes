"use client";

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

export const useFeedback = () => {
  const { setSBMessage } = useSnackbar();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);

  /**
   * Processes authentication success and updates application global store.
   */
  const handleAuthSuccess = (user?: IUser, onSuccessCallback?: () => void) => {
    if (user) {
      const userClone = { ...user };
      setAuthUser(userClone);
      setAuthStatus("AUTHENTICATED");

      purgeCache({
        queryClient,
        queryKeys: STORAGE_KEYS.AUTH_TRANSIT,
      });

      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.verification_successful_tagline,
          ),
          msgStatus: "SUCCESS",
        },
      });

      if (onSuccessCallback) onSuccessCallback();

      if (!userClone.isOnboarded) {
        setAccountStatus("NOT_ONBOARDED");
        navigateTo(CLIENT_ROUTES.onboarding, {
          loadPage: true,
        });
      }
    } else {
      setAccountStatus("ACTIVE");
      navigateTo(CLIENT_ROUTES.home, { loadPage: true, type: "replace" });
    }
  };

  /**
   * Processes settings or profile update verification.
   */
  const handleAccountUpdateSuccess = () => {
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
    navigateTo(CLIENT_ROUTES.settings, { loadPage: true, type: "replace" });
  };

  /**
   * Processes password reset authorization step success.
   */
  const handlePassResetSuccess = (identifier?: string) => {
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

    navigateTo(CLIENT_ROUTES.resetPassword, {
      loadPage: true,
      type: "replace",
    });
  };

  /**
   * Processes settings or profile update completion.
   */
  const handleMfaActivationSuccess = () => {
    purgeCache({
      queryClient,
      queryKeys: STORAGE_KEYS.MFA_UPDATE_TRANSIT,
    });

    setSBMessage({
      msg: {
        tagline: translateTxtString(AUTH_FEEDBACK.mfa_activated),
        msgStatus: "SUCCESS",
      },
    });
    navigateTo(CLIENT_ROUTES.home, { loadPage: true, type: "replace" });
  };

  return {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  };
};
