"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError, AUTH_FEEDBACK } from "@repo/core";
import {
  OAuthExchangeRequest,
  OAuthExchangeResponse,
  OAuthPurpose,
  OAuthService,
} from "./service";
import { useLoginFeedback } from "../login/hooks/useFeedback";
import { useSignupFeedback } from "../signup/registration/useFeedback";
import { useStaticTranslation } from "@repo/shared-hooks";
import { useSearchParams } from "next/navigation";

interface UseOAuthProps {
  purpose?: OAuthPurpose;
  email?: string;
  setMsg?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  autoPromptGoogle?: boolean;
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
  const [isSdkReady, setIsSdkReady] = useState(false);

  // Mutation pipeline to send validated provider token to Express backend
  const { mutate: executeOAuthPopupSignIn, isPending: isOAuthLoading } =
    useMutation({
      mutationFn: async (payload: OAuthExchangeRequest) => {
        return await oauthPopupSignIn(payload);
      },
      onSuccess: (res: OAuthExchangeResponse) => {
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
        if (purpose === "REGISTRATION" && setMsg) {
          handleSignupError(err, setMsg);
        } else {
          handleLoginError({ error: err, setMsg });
        }
      },
    });

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
  }, [isSdkReady, autoPromptGoogle, executeOAuthPopupSignIn, purpose]);

  /**
   * Triggers full-page Google OAuth authorization redirect.
   */
  const handleGoogleRedirectSignIn = useCallback(() => {
    const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;
    window.location.href = `${gatewayUrl}/oauth/google`;
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

  return {
    handleGoogleRedirectSignIn,
    handleAppleSignIn,
    isOAuthLoading,
    isSdkReady,
    handleOAuthRedirectError,
  };
};
