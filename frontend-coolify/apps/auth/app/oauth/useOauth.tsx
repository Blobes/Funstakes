"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ApiError,
  AUTH_FEEDBACK,
  AuthPurposeType,
  COMMON_BUTTON_LABELS,
  SERVER_API,
  SNACKBAR_DURATION,
  useGlobalStore,
} from "@repo/core";
import {
  OAuthExchangeRequest,
  OAuthExchangeResponse,
  OAuthProvider,
  OAuthService,
} from "./service";
import { useLoginFeedback } from "../login/hooks/useFeedback";
import { useSignupFeedback } from "../signup/registration/useFeedback";
import { useMisc, useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import { useSearchParams } from "next/navigation";
import { usePopup } from "@repo/features";
import { ConfirmAction, TransText } from "@repo/shared-ui";
import { UserPlus } from "lucide-react";

interface UseOAuthProps {
  purpose?: AuthPurposeType;
  email?: string;
  setMsg?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  autoPromptGoogle?: boolean;
}

export interface PendingOAuthAction {
  type: "CONFIRM_REGISTRATION" | "CONFIRM_LOGIN";
  provider: OAuthProvider;
  idToken: string;
  email: string;
}

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 650;

const DISABLE_OAUTH = true;

const openOauthPopupWindow = (url: string, name: string): Window | null => {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
  const features = [
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    "resizable=yes",
    "scrollbars=yes",
    "status=no",
  ].join(",");
  return window.open(url, name, features);
};

/**
 * Orchestrates third-party OAuth provider initialization, One Tap popups, and full-page redirects.
 */
export const useOAuth = ({
  purpose = "LOGIN",
  email = "",
  setMsg,
  autoPromptGoogle = true,
}: UseOAuthProps = {}) => {
  const { oauthPopupSignIn } = OAuthService();
  const { handleLoginSuccess, handleLoginError } = useLoginFeedback({});
  const { handleSignupSuccess, handleSignupError } = useSignupFeedback();
  const { translateTxtString } = useStaticTranslation();
  const { openPopup } = usePopup();
  const { closeModal } = useMisc();
  const { setSBMessage } = useSnackbar();
  const setIsSpaLoading = useGlobalStore((state) => state.setIsSpaLoading);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const oauthPopupRef = useRef<Window | null>(null);

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
  }, [
    setPendingOAuthAction,
    executeOAuthPopupSignIn,
    closeModal,
    pendingOAuthAction,
  ]);

  /**
   * Dismisses pending authorization confirmation state.
   */
  const cancelOAuthAction = useCallback(() => {
    setPendingOAuthAction(null);
    closeModal();
  }, [closeModal]);

  const closeOAuthPopup = useCallback(() => {
    if (oauthPopupRef.current && !oauthPopupRef.current.closed) {
      oauthPopupRef.current.close();
    }
    oauthPopupRef.current = null;
  }, []);

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
   * Opens centralized backend provider OAuth URL in popup.
   */
  const openOAuthProviderPopup = useCallback(
    (endpoint: string, popupName: string) => {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${backendUrl}${endpoint}`;

      if (oauthPopupRef.current && !oauthPopupRef.current.closed) {
        oauthPopupRef.current.focus();
        return;
      }
      const popup = openOauthPopupWindow(url, popupName);
      if (!popup) {
        window.location.href = url;
        return;
      }
      oauthPopupRef.current = popup;
    },
    [],
  );

  /**
   * Triggers Google sign-in popup flow.
   */
  const handleGoogleSignIn = useCallback(() => {
    openOAuthProviderPopup(
      SERVER_API.initiateGoogleOauth,
      "google_oauth_popup",
    );
  }, [openOAuthProviderPopup]);

  /**
   * Triggers Facebook sign-in popup flow.
   */
  const handleFacebookSignIn = useCallback(() => {
    openOAuthProviderPopup(
      SERVER_API.initiateFacebookOauth,
      "facebook_oauth_popup",
    );
  }, [openOAuthProviderPopup]);

  /**
   * Triggers GitHub sign-in popup flow.
   */
  const handleGitHubSignIn = useCallback(() => {
    openOAuthProviderPopup(
      SERVER_API.initiateGithubOauth,
      "github_oauth_popup",
    );
  }, [openOAuthProviderPopup]);

  /**
   * Triggers X (Twitter) sign-in popup flow.
   */
  const handleXSignIn = useCallback(() => {
    openOAuthProviderPopup(SERVER_API.initiateXOauth, "x_oauth_popup");
  }, [openOAuthProviderPopup]);

  /**
   * Triggers LinkedIn sign-in popup flow.
   */
  const handleLinkedInSignIn = useCallback(() => {
    openOAuthProviderPopup(
      SERVER_API.initiateLinkedinOauth,
      "linkedin_oauth_popup",
    );
  }, [openOAuthProviderPopup]);

  /**
   * Triggers native Apple Signin authorization in-page popup prompt.
   */
  const handleAppleSignIn = useCallback(async () => {
    if (DISABLE_OAUTH) {
      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.oauth_provider_not_available("Apple"),
          ),
          msgStatus: "INFO",
          duration: SNACKBAR_DURATION.SECS_6,
        },
      });
      return;
    }

    if (!window.AppleID?.auth) return;

    if (!isSdkReady || !window.AppleID?.auth) return;
    window.AppleID.auth.init({
      clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
      scope: "name email",
      redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI!,
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
  }, [executeOAuthPopupSignIn, purpose, isSdkReady]);

  /**
   * Maps OAuth error query parameters to localized error feedback messages.
   */
  const handleOAuthErrorMsg = useCallback(
    (errorCode: string) => {
      const getErrorMessage = (code: string) => {
        switch (code) {
          case "INVALID_OAUTH_CODE":
            return translateTxtString(AUTH_FEEDBACK.invalid_oauth_token);
          case "MISSING_ID_TOKEN":
            return translateTxtString(AUTH_FEEDBACK.missing_oauth_id_token);
          case "MERGE_RESTRICTION":
            return translateTxtString(AUTH_FEEDBACK.oauth_provider_conflict);
          case "OAUTH_CREDENTIAL_UNAVAILABLE":
            return translateTxtString(
              AUTH_FEEDBACK.oauth_credential_unavailable,
            );
          case "OAUTH_EMAIL_REQUIRED":
            return translateTxtString(AUTH_FEEDBACK.oauth_email_required);
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
      setSBMessage({
        msg: {
          tagline: message,
          msgStatus: "ERROR",
          duration: SNACKBAR_DURATION.SECS_15,
        },
      });

      if (purpose === "REGISTRATION" && setMsg) {
        handleSignupError({ localizedErrMsg: message } as ApiError, setMsg);
      } else {
        handleLoginError({
          error: { localizedErrMsg: message } as ApiError,
          setMsg,
        });
      }
    },
    [
      handleLoginError,
      handleSignupError,
      purpose,
      setMsg,
      translateTxtString,
      setSBMessage,
    ],
  );

  const getAllowedOAuthOrigins = (): string[] => {
    const origins = new Set<string>();
    if (typeof window !== "undefined") {
      origins.add(window.location.origin);
    }
    const shell = process.env.NEXT_PUBLIC_SHELL_URL;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (shell) origins.add(new URL(shell).origin);
    if (api) origins.add(new URL(api).origin);
    return [...origins];
  };

  // Listener for backend redirect response
  useEffect(() => {
    const allowedOrigins = getAllowedOAuthOrigins();

    const onMessage = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) return;

      const data = event.data;
      if (!data || data.source !== "funstakes-oauth") return;

      closeOAuthPopup();

      if (data.type === "OAUTH_ERROR") {
        handleOAuthErrorMsg(data.errorCode || "SERVER_ERROR");
        return;
      }

      // Server already set cookies — just route / refresh session
      if (data.type === "OAUTH_SESSION_SUCCESS") {
        const path =
          data.redirectPath || (data.isNewUser ? "/onboarding" : "/");
        window.location.assign(path);
        return;
      }

      // Mirror SPA confirm flows
      if (data.type === "OAUTH_ACCOUNT_NOT_FOUND" && data.idToken) {
        setPendingOAuthAction({
          type: "CONFIRM_REGISTRATION",
          provider: data.provider || "GOOGLE",
          idToken: data.idToken,
          email: data.email || "",
        });
        return;
      }

      if (data.type === "OAUTH_ACCOUNT_EXISTS" && data.idToken) {
        setPendingOAuthAction({
          type: "CONFIRM_LOGIN",
          provider: data.provider || "GOOGLE",
          idToken: data.idToken,
          email: data.email || "",
        });
        return;
      }

      // Fallback: SPA-style token exchange (if you ever post idToken only)
      if (data.type === "OAUTH_SUCCESS" && data.idToken) {
        executeOAuthPopupSignIn({
          provider: data.provider || "GOOGLE",
          idToken: data.idToken,
          purpose,
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [closeOAuthPopup, executeOAuthPopupSignIn, handleOAuthErrorMsg, purpose]);

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
          tagline={<TransText {...taglineText} />}
          cancelLabel={translateTxtString(COMMON_BUTTON_LABELS.cancel)}
          confirmLabel={translateTxtString(COMMON_BUTTON_LABELS.continue)}
          onConfirm={confirmOAuthAction}
          onCancel={cancelOAuthAction}
        />
      ),
    });
  }, [pendingOAuthAction]);

  return {
    handleGoogleSignIn,
    handleAppleSignIn,
    handleFacebookSignIn,
    handleGitHubSignIn,
    handleXSignIn,
    handleLinkedInSignIn,
    isOAuthLoading,
    isSdkReady,
    handleOAuthRedirectError: handleOAuthErrorMsg,
    pendingOAuthAction,
  };
};
