"use client";

import { ISinglePayload, IUser, AuthStepName, SERVER_API } from "@repo/core";
import { apiClient } from "@repo/helpers";

interface SignupRequest {
  email: string;
  password: string;
  phone?: string;
}

export interface SignupResponse extends ISinglePayload<IUser> {
  accessToken?: string | null;
  requireVerification?: boolean;
}

/**
 * Services for user onboarding data persistence.
 */
export const OnboardingService = () => {
  const syncIdentity = async (payload: {
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<ISinglePayload<IUser>> => {
    return await apiClient<ISinglePayload<IUser>>(SERVER_API.updateBasicInfo, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const updateProgress = async (
    step: AuthStepName,
    isDone: boolean = false,
  ) => {
    return await apiClient(SERVER_API.updateOnboarding, {
      method: "POST",
      body: JSON.stringify({ onboardingStep: step, isOnboarded: isDone }),
    });
  };

  return { syncIdentity, updateProgress };
};

/**
 * Handles communication with the authentication server endpoint for new user registration.
 */
export const SignupService = () => {
  const createAccount = async (
    credentials: SignupRequest,
  ): Promise<SignupResponse> => {
    return await apiClient<SignupResponse>(SERVER_API.signup, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  };

  return { createAccount };
};
