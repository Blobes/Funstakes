"use client";

import { SERVER_API } from "@repo/core";
import { apiClient } from "@repo//helpers";
import { SignupResponse } from "../signup/service";
import { LoginResponse } from "../login/service";

export type OAuthProvider = "GOOGLE" | "APPLE";
export type OAuthPurpose = "REGISTRATION" | "LOGIN";

export interface OAuthExchangeRequest {
  provider: OAuthProvider;
  idToken: string;
  purpose?: OAuthPurpose;
  identityPayload?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface OAuthExchangeResponse extends SignupResponse, LoginResponse {
  isNewUser?: boolean;
}

export const OAuthService = () => {
  /**
   * Exchanges validated third-party provider ID token for session credentials.
   */
  const oauthPopupSignIn = async (
    payload: OAuthExchangeRequest,
  ): Promise<OAuthExchangeResponse> => {
    return await apiClient<OAuthExchangeResponse>(SERVER_API.oauthPopup, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };
  return { oauthPopupSignIn };
};
