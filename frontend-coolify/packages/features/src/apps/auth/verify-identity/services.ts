"use client";

import { apiClient } from "@repo/helpers";
import {
  ISinglePayload,
  OtpMessageChannel,
  TransitPurpose,
  SERVER_API,
  IdentifierType,
  VerifyIdentityMethod,
} from "@repo/core";

export interface OtpRequest {
  code?: string;
  recipient?: string;
  purpose?: TransitPurpose;
  messageChannel?: OtpMessageChannel;
}

export interface OtpResponse {
  identifier?: string;
  verificationToken?: string;
  purpose?: TransitPurpose;
  otpIdentifierType?: IdentifierType;
  verificationMethod?: VerifyIdentityMethod;
}

export interface CommitUpdateRequest extends OtpResponse {
  targetDeviceId?: string;
}
export interface CommitUpdateResponse {
  channelVerified?: OtpMessageChannel;
  refreshToken?: string;
  accessToken?: string;
}

export type TotpActionType = "AUTHENTICATE" | "CONFIGURE";

export interface TotpSetupResponse {
  qrCodeDataUrl: string | null;
  manualEntryKey: string | null;
  isMfaActive: boolean;
}

export interface TotpVerificationRequest {
  actionType: TotpActionType;
  token: string;
  identifier?: string;
}

export interface TotpVerificationResponse {
  isRecovery?: boolean;
  backupCodes?: string[];
}

export interface IdentifierChangeResult {
  identifier?: string;
  loggedOut?: boolean;
}

export interface SetupSecurityQuestionsRequest {
  questions: {
    question: string;
    answer: string;
  }[];
}
export interface SetupSecurityQuestionsResponse {
  isMfaActive: boolean;
}
export interface FetchSecurityQuestionsResponse {
  questions: string[];
}
export interface VerifySecurityQuestionsRequest {
  identifier: string;
  answers: {
    question: string;
    answer: string;
  }[];
}
export interface VerifySecurityQuestionsResponse {
  verified: boolean;
  invalidQuestions?: string[];
}

export interface CheckStatusResponse {
  exists: boolean;
  phoneNumber: string;
  waId?: string;
}

export const VerifyIdentityService = () => {
  /**
   * Dispatches an OTP code over specified messaging channels (EMAIL, WHATSAPP, SMS).
   */
  const dispatchMsgCode = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<OtpRequest>> => {
    const { recipient, messageChannel } = request;
    return await apiClient<ISinglePayload<OtpRequest>>(SERVER_API.sendMsgCode, {
      method: "POST",
      body: JSON.stringify({ recipient, messageChannel }),
    });
  };

  /**
   * Validates messaging-based OTP verification code.
   */
  const verifyMsgCode = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<OtpResponse>> => {
    const { code, recipient, purpose = "LOGIN_VERIFICATION" } = request;
    return await apiClient(SERVER_API.verifyMsgCode, {
      method: "POST",
      body: JSON.stringify({ code, recipient, purpose }),
    });
  };

  /**
   * Sends request to verify WhatsApp registration status for a target phone number.
   */
  const checkWhatsappStatus = async (
    phoneNumber: string,
  ): Promise<ISinglePayload<CheckStatusResponse>> => {
    return await apiClient(
      `${SERVER_API.checkWhatsappStatus}/phoneNumber=${phoneNumber}`,
      {
        method: "GET",
      },
    );
  };

  /**
   * Finalizes account state updates across active security checkpoints.
   */
  const commitAccountUpdate = async (
    request: CommitUpdateRequest,
  ): Promise<ISinglePayload<any>> => {
    const {
      identifier,
      verificationToken,
      purpose = "LOGIN_VERIFICATION",
      otpIdentifierType,
      verificationMethod,
      targetDeviceId,
    } = request;
    return await apiClient(SERVER_API.otpAccountUpdate, {
      method: "PATCH",
      body: JSON.stringify({
        identifier,
        verificationToken,
        purpose,
        otpIdentifierType,
        verificationMethod,
        targetDeviceId,
      }),
    });
  };

  /**
   * Finalizes email address changes with verification code payload.
   */
  const finalizeEmailUpdateOtp = async (
    code: string,
  ): Promise<ISinglePayload<IdentifierChangeResult>> => {
    return await apiClient(SERVER_API.finalizeEmailChange, {
      method: "PATCH",
      body: JSON.stringify({ code }),
    });
  };

  /**
   * Finalizes phone number changes with verification code payload.
   */
  const finalizePhoneUpdateOtp = async (
    code: string,
  ): Promise<ISinglePayload<IdentifierChangeResult>> => {
    return await apiClient(SERVER_API.finalizePhoneChange, {
      method: "PATCH",
      body: JSON.stringify({ code }),
    });
  };

  /**
   * Fetches TOTP configuration.
   */
  const fetchTotpSetup = async (): Promise<
    ISinglePayload<TotpSetupResponse>
  > => {
    return await apiClient<ISinglePayload<TotpSetupResponse>>(
      SERVER_API.fetchTotpSetup,
      { method: "GET" },
    );
  };

  /**
   * Validates Authenticator TOTP token codes.
   */
  const verifyTotpCode = async (
    request: TotpVerificationRequest,
  ): Promise<ISinglePayload<TotpVerificationResponse>> => {
    const { actionType, token, identifier } = request;
    return await apiClient<ISinglePayload<TotpVerificationResponse>>(
      SERVER_API.verifyTotp,
      {
        method: "POST",
        body: JSON.stringify({ actionType, token, identifier }),
      },
    );
  };

  /**
   * Validates Security Questions token codes.
   */
  const setupSecurityQuestions = async (
    request: SetupSecurityQuestionsRequest,
  ): Promise<ISinglePayload<SetupSecurityQuestionsResponse>> => {
    const { questions } = request;
    return await apiClient<ISinglePayload<SetupSecurityQuestionsResponse>>(
      SERVER_API.setupSecurityQuestions,
      {
        method: "POST",
        body: JSON.stringify({ questions }),
      },
    );
  };

  /**
   * Fetches user security questions.
   */
  const fetchSecurityQuestions = async (
    identifier: string,
  ): Promise<ISinglePayload<FetchSecurityQuestionsResponse>> => {
    return await apiClient(
      `${SERVER_API.fetchSecurityQuestions}/identifier=${identifier}`,
      { method: "GET" },
    );
  };

  /**
   * Validates Security Questions token codes.
   */
  const verifySecurityQuestions = async (
    request: VerifySecurityQuestionsRequest,
  ): Promise<ISinglePayload<VerifySecurityQuestionsResponse>> => {
    const { identifier, answers } = request;
    return await apiClient<ISinglePayload<VerifySecurityQuestionsResponse>>(
      SERVER_API.verifySecurityQuestions,
      {
        method: "POST",
        body: JSON.stringify({ identifier, answers }),
      },
    );
  };

  /**
   * Reset messaging-based OTP verification code state at the backend.
   */
  const resetMsgCode = async (
    recipient: string,
  ): Promise<ISinglePayload<null>> => {
    return await apiClient(SERVER_API.resetMsgCode, {
      method: "POST",
      body: JSON.stringify({ recipient }),
    });
  };

  return {
    dispatchMsgCode,
    verifyMsgCode,
    checkWhatsappStatus,
    commitAccountUpdate,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    fetchTotpSetup,
    verifyTotpCode,
    resetMsgCode,
    setupSecurityQuestions,
    verifySecurityQuestions,
    fetchSecurityQuestions,
  };
};
