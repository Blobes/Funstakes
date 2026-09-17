"use client";

import { apiClient } from "@repo/helpers";
import {
  IUser,
  ISinglePayload,
  SERVER_API,
  VerificationReason,
  CheckPurpose,
} from "@repo/core";

interface LoginRequest {
  identifier: string;
  password: string;
}
export interface LoginResponse extends ISinglePayload<IUser> {
  requireVerification?: boolean;
  verificationReason: VerificationReason;
  deviceId?: string;
  fixedMsg?: string;
  accessToken: string | null; // Keep short-lived token in volatile memory only
}

export interface CheckRequest {
  identifier: string;
  purpose?: CheckPurpose;
}

export interface CheckResponse extends ISinglePayload<IUser> {
  isExisting: boolean;
  suggestions?: string[];
  signedUpWith?: "EMAIL" | "GOOGLE" | "APPLE";
}

export const LoginService = () => {
  const checkEmail = async (request: CheckRequest): Promise<CheckResponse> => {
    return await apiClient<CheckResponse>(SERVER_API.checkEmail, {
      method: "POST",
      body: JSON.stringify({
        email: request.identifier,
        purpose: request.purpose,
      }),
    });
  };

  const checkPhone = async (request: CheckRequest): Promise<CheckResponse> => {
    return await apiClient<CheckResponse>(SERVER_API.checkPhone, {
      method: "POST",
      body: JSON.stringify({
        phone: request.identifier,
        purpose: request.purpose,
      }),
    });
  };

  const checkUsername = async (
    request: CheckRequest,
  ): Promise<CheckResponse> => {
    return await apiClient<CheckResponse>(SERVER_API.checkUsername, {
      method: "POST",
      body: JSON.stringify({
        username: request.identifier,
        purpose: request.purpose || "LOGIN",
      }),
    });
  };

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    return await apiClient<LoginResponse>(SERVER_API.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  };

  return { checkEmail, checkPhone, checkUsername, login };
};
