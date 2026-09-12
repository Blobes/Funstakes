import { OtpTransitData, IUser, TransitPurpose } from "@repo/core";

/**
 * Mock user payload for transit data preview.
 */
const mockUserPayload: IUser = {
  _id: "usr_mock_9981",
  email: "developer@example.com",
  isEmailVerified: true,
  isPhoneVerified: true,
  hasEnabledMFA: true,
  securityQuestionsId: "sec_q_mock_773",
  totpAuth: {
    secret: "JBSWY3DPEHPK3PXP",
    backupCodes: ["12345678", "87654321"],
  },
};

/**
 * Returns mock transit data array based on the provided purpose parameter.
 */
export const mockTransitData = (
  purpose: TransitPurpose = "LOGIN_VERIFICATION",
): OtpTransitData[] => {
  const transitMap: Record<TransitPurpose, OtpTransitData[]> = {
    LOGIN_VERIFICATION: [
      {
        transitId: "login_verification_preview_session",
        purpose: "LOGIN_VERIFICATION",
        identifier: "developer@example.com",
        otpMessageChannel: "EMAIL",
        verificationMethod: "MESSAGING",
        reason: "NEW_DEVICE",
        dispatchOnload: false,
        payload: mockUserPayload,
      },
    ],
    SIGNUP_VERIFICATION: [
      {
        transitId: "signup_verification_preview_session",
        purpose: "SIGNUP_VERIFICATION",
        identifier: "+1234567890",
        otpMessageChannel: "WHATSAPP",
        verificationMethod: "MESSAGING",
        reason: "NEW_ACCOUNT",
        dispatchOnload: true,
        payload: mockUserPayload,
      },
    ],
    MFA_ACTIVATION: [
      {
        transitId: "mfa_activation_preview_session",
        purpose: "MFA_ACTIVATION",
        identifier: "+23456789012",
        otpMessageChannel: "SMS",
        verificationMethod: "TOTP",
        reason: "UNTRUSTED_DEVICE",
        dispatchOnload: false,
        payload: mockUserPayload,
      },
    ],
    PASSWORD_RESET: [
      {
        transitId: "password_reset_preview_session",
        purpose: "PASSWORD_RESET",
        identifier: "developer@example.com",
        otpMessageChannel: "EMAIL",
        verificationMethod: "MESSAGING",
        reason: "PASSWORD_RESET",
        dispatchOnload: false,
        payload: {
          currentStep: "CREDENTIAL",
          nextStep: "NEW_PASSWORD",
          identifier: "developer@example.com",
        },
      },
    ],
    ACCOUNT_UPDATE: [
      {
        transitId: "account_update_preview_session",
        purpose: "ACCOUNT_UPDATE",
        identifier: "developer@example.com",
        otpMessageChannel: "EMAIL",
        verificationMethod: "MESSAGING",
        reason: "STALE_DEVICE",
        dispatchOnload: false,
        payload: {
          field: "email",
          oldValue: "old_developer@example.com",
        },
      },
    ],
    IDENTIFIER_UPDATE: [
      {
        transitId: "identifier_update_preview_session",
        purpose: "IDENTIFIER_UPDATE",
        identifier: "+19876543210",
        otpMessageChannel: "SMS",
        verificationMethod: "MESSAGING",
        reason: "UNVERIFIED_ACCOUNT",
        dispatchOnload: false,
        payload: {
          field: "phoneNumber",
          oldValue: "+10000000000",
        },
      },
    ],
  };

  return transitMap[purpose];
};
