"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ApiError,
  AUTH_FEEDBACK,
  AuthPurposeType,
  COMMON_BUTTON_LABELS,
  SERVER_API,
  useGlobalStore,
} from "@repo/core";
import {
  OAuthExchangeRequest,
  OAuthExchangeResponse,
  OAuthService,
} from "./service";
import { useLoginFeedback } from "../login/hooks/useFeedback";
import { useSignupFeedback } from "../signup/registration/useFeedback";
import { useMisc, useStaticTranslation } from "@repo/shared-hooks";
import { useSearchParams } from "next/navigation";
import { usePopup } from "@repo/features";
import { ConfirmAction } from "@repo/shared-ui";
import { UserPlus } from "lucide-react";

interface UseOAuthProps {
  purpose?: AuthPurposeType;
  email?: string;
  setMsg?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  autoPromptGoogle?: boolean;
}

export interface PendingOAuthAction {
  type: "CONFIRM_REGISTRATION" | "CONFIRM_LOGIN";
  provider: "GOOGLE" | "APPLE";
  idToken: string;
  email: string;
}

/**
 * Orchestrates third-party OAuth provider initialization, One Tap popups, and full-page redirects.
 */
export const useOAuth = ({
  purpose = "LOGIN",
  email = "",
  setMsg,
  autoPromptGoogle = true,
}: UseOAuthProps = {}) => {
  const searchParams = useSearchParams();
  const { oauthPopupSignIn } = OAuthService();
  const { handleLoginSuccess, handleLoginError } = useLoginFeedback({});
  const { handleSignupSuccess, handleSignupError } = useSignupFeedback();
  const { translateTxtString } = useStaticTranslation();
  const { openPopup } = usePopup();
  const { closeModal } = useMisc();
  const setIsSpaLoading = useGlobalStore((state) => state.setIsSpaLoading);
  const [isSdkReady, setIsSdkReady] = useState(false);

  // Holds pending confirmation details when flow state requires user intent conversion
  const [pendingOAuthAction, setPendingOAuthAction] =
    useState<PendingOAuthAction | null>(null);

  // Mutation pipeline to send validated provider token to Express backend
  const { mutate: executeOAuthPopupSignIn, isPending: isOAuthLoading } =
    useMutation({
      mutationFn: async (payload: OAuthExchangeRequest) => {
        setIsSpaLoading(true);
        return await oauthPopupSignIn(payload);
      },
      onSuccess: (res: OAuthExchangeResponse) => {
        setPendingOAuthAction(null);
        if (res.isNewUser || purpose === "REGISTRATION") {
          handleSignupSuccess(res, { email, signupMethod: "OAUTH" });
        } else {
          handleLoginSuccess({
            loginResponse: res,
            identifierType: "EMAIL",
            loginMethod: "OAUTH",
          });
        }
      },
      onError: (err: ApiError) => {
        // Intercept account non-existence when flow purpose is LOGIN
        if (err?.statusType === "ACCOUNT_NOT_FOUND" && err?.payload) {
          setPendingOAuthAction({
            type: "CONFIRM_REGISTRATION",
            provider: err.payload.provider,
            idToken: err.payload.idToken,
            email: err.payload.email,
          });

          return;
        }

        // Intercept existing account when flow purpose is REGISTRATION
        if (err?.statusType === "ACCOUNT_ALREADY_EXISTS" && err?.payload) {
          setPendingOAuthAction({
            type: "CONFIRM_LOGIN",
            provider: err.payload.provider,
            idToken: err.payload.idToken,
            email: err.payload.email,
          });
          return;
        }

        if (purpose === "REGISTRATION") {
          handleSignupError(err, setMsg);
        } else {
          handleLoginError({ error: err, setMsg });
        }
      },
      onSettled: () => {
        setIsSpaLoading(false);
      },
    });

  /**
   * Confirms pending action and retries OAuth authentication with converted purpose.
   */
  const confirmOAuthAction = useCallback(() => {
    if (!pendingOAuthAction) return;

    const targetPurpose: AuthPurposeType =
      pendingOAuthAction.type === "CONFIRM_REGISTRATION"
        ? "REGISTRATION"
        : "LOGIN";

    const { provider, idToken } = pendingOAuthAction;

    // Reset pending action state and dismiss existing modal context before re-triggering mutation
    setPendingOAuthAction(null);
    closeModal();

    executeOAuthPopupSignIn({
      provider,
      idToken,
      purpose: targetPurpose,
    });
  }, [setPendingOAuthAction, executeOAuthPopupSignIn, closeModal]);

  /**
   * Dismisses pending authorization confirmation state.
   */
  const cancelOAuthAction = useCallback(() => {
    setPendingOAuthAction(null);
    closeModal();
  }, [closeModal]);

  // Load Google and Apple Client SDK Scripts dynamically
  useEffect(() => {
    const loadGoogleSdk = () => {
      if (document.getElementById("google-jssdk")) return;
      const script = document.createElement("script");
      script.id = "google-jssdk";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const loadAppleSdk = () => {
      if (document.getElementById("apple-jssdk")) return;
      const script = document.createElement("script");
      script.id = "apple-jssdk";
      script.src =
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleSdk();
    loadAppleSdk();

    const checkSdkLoaded = setInterval(() => {
      if (window.google?.accounts?.id && window.AppleID?.auth) {
        setIsSdkReady(true);
        clearInterval(checkSdkLoaded);
      }
    }, 300);

    return () => clearInterval(checkSdkLoaded);
  }, []);

  /**
   * Automatically initializes and displays Google One Tap popup on initial load.
   */
  useEffect(() => {
    if (!isSdkReady || !autoPromptGoogle || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      use_fedcm_for_prompt: false,
      callback: (response: { credential?: string }) => {
        if (response.credential) {
          executeOAuthPopupSignIn({
            provider: "GOOGLE",
            idToken: response.credential,
            purpose,
          });
        }
      },
    });

    // Display Google One Tap prompt on initial page load
    window.google.accounts.id.prompt();
  }, [
    isSdkReady,
    autoPromptGoogle,
    executeOAuthPopupSignIn,
    purpose,
    setIsSpaLoading,
  ]);

  /**
   * Triggers full-page Google OAuth authorization redirect.
   */
  const handleGoogleRedirectSignIn = useCallback(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    // window.open(
    //   `${backendUrl}${SERVER_API.initiateGoogleOauth}`,
    //   "_blank",
    //   "noopener,noreferrer",
    // );
    window.location.href = `${backendUrl}${SERVER_API.initiateGoogleOauth}`;
  }, []);

  /**
   * Triggers native Apple Sign In authorization prompt.
   */
  const handleAppleSignIn = useCallback(async () => {
    if (!window.AppleID?.auth) return;

    window.AppleID.auth.init({
      clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
      scope: "name email",
      redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
      usePopup: true,
    });

    try {
      const response = await window.AppleID.auth.signIn();
      if (response?.authorization?.id_token) {
        const firstName = response.user?.name?.firstName;
        const lastName = response.user?.name?.lastName;

        executeOAuthPopupSignIn({
          provider: "APPLE",
          idToken: response.authorization.id_token,
          purpose,
          identityPayload:
            firstName || lastName ? { firstName, lastName } : undefined,
        });
      }
    } catch (error) {
      console.error("Apple Sign-In authorization failed:", error);
    }
  }, [executeOAuthPopupSignIn, purpose]);

  /**
   * Maps OAuth error query parameters to localized error feedback messages.
   */
  const handleOAuthRedirectError = useCallback(
    (errorCode: string) => {
      const getErrorMessage = (code: string) => {
        switch (code) {
          case "INVALID_OAUTH_CODE":
            return translateTxtString(AUTH_FEEDBACK.invalid_oauth_token);
          case "MISSING_ID_TOKEN":
            return translateTxtString(AUTH_FEEDBACK.missing_oauth_id_token);
          case "MERGE_RESTRICTION":
            return translateTxtString(AUTH_FEEDBACK.oauth_provider_conflict);
          case "ACCOUNT_DEACTIVATED":
            return translateTxtString(AUTH_FEEDBACK.account_deactivated);
          case "ACCOUNT_SUSPENDED":
          case "ACCOUNT_BANNED":
            return translateTxtString(AUTH_FEEDBACK.account_suspended);
          default:
            return translateTxtString(AUTH_FEEDBACK.server_error);
        }
      };

      const message = getErrorMessage(errorCode);
      if (purpose === "REGISTRATION" && setMsg) {
        handleSignupError({ localizedErrMsg: message } as ApiError, setMsg);
      } else {
        handleLoginError({
          error: { localizedErrMsg: message } as ApiError,
          setMsg,
        });
      }
    },
    [handleLoginError, handleSignupError, purpose, setMsg, translateTxtString],
  );

  // Extracting and processing OAuth error query parameters on mount
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError) return;
    handleOAuthRedirectError(oauthError);
    // Cleaning up error query parameter from browser address bar
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("error");
    window.history.replaceState({}, "", currentUrl.pathname);
  }, [searchParams, handleOAuthRedirectError]);

  /**
   * Opens confirmation popup whenever a pending OAuth action state is set
   */
  useEffect(() => {
    if (!pendingOAuthAction) return;

    const headlineText =
      pendingOAuthAction.type === "CONFIRM_REGISTRATION"
        ? AUTH_FEEDBACK.create_account
        : AUTH_FEEDBACK.sign_in;

    const taglineText =
      pendingOAuthAction.type === "CONFIRM_REGISTRATION"
        ? AUTH_FEEDBACK.oauth_confirm_registration(pendingOAuthAction.email)
        : AUTH_FEEDBACK.oauth_confirm_login(pendingOAuthAction.email);

    openPopup({
      name: "CONFIRM_LOGIN_OR_SIGNUP",
      content: (
        <ConfirmAction
          icon={<UserPlus size={32} />}
          headline={translateTxtString(headlineText)}
          tagline={translateTxtString(taglineText)}
          cancelLabel={translateTxtString(COMMON_BUTTON_LABELS.cancel)}
          confirmLabel={translateTxtString(COMMON_BUTTON_LABELS.continue)}
          onConfirm={confirmOAuthAction}
          onCancel={cancelOAuthAction}
        />
      ),
    });
  }, [pendingOAuthAction]);

  return {
    handleGoogleRedirectSignIn,
    handleAppleSignIn,
    isOAuthLoading,
    isSdkReady,
    handleOAuthRedirectError,
    pendingOAuthAction,
  };
};
