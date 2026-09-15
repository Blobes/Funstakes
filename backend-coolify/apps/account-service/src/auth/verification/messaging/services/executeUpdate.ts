import { v4 as uuidv4 } from "uuid";
import { IUserDocument } from "@repo/database";
import {
  cleanDeviceSessions,
  fetchSingleUser,
  MESSAGES_REGISTRY,
  OtpActionType,
  OtpIdentifierType,
  TransInfo,
  upsertDevice,
  VerificationMethod,
} from "@repo/shared";
import { verifyOtpActionToken } from "./verificationToken";
import { issueAuthTokens } from "@repo/security";
import { authTokens } from "@/envVars";

export interface ICommitAccountUpdateInput {
  identifier?: string;
  purpose: OtpActionType;
  verificationToken?: string;
  otpIdentifierType?: OtpIdentifierType;
  deviceToken?: string;
  userAgent: string;
  ipAddress?: string;
  verificationMethod?: VerificationMethod;
}

export interface ICommitAccountUpdateResult {
  status:
    | "SUCCESS"
    | "USER_NOT_FOUND"
    | "UNAUTHORIZED"
    | "INVALID_PURPOSE"
    | "BAD_REQUEST"
    | "MISSING_IDENTIFIER";
  transInfo?: TransInfo;
  payload?: {
    identityUpdated?: "EMAIL" | "PHONE_NUMBER" | null;
    loggedOut?: boolean;
    clearLocalCookies?: boolean;
    credentialUpdated?: string;
    channelVerified?: OtpIdentifierType;
    accessToken?: string;
    refreshToken?: string;
  };
}

/**
 * Validates requirements for identity update codes.
 */
export const checkPendingIdentifier = (
  user: IUserDocument,
  otpIdentifierType?: OtpIdentifierType,
): TransInfo | null => {
  const hasPending =
    otpIdentifierType === "EMAIL"
      ? Boolean(user.pendingEmail)
      : Boolean(user.pendingPhoneNumber);

  if (!hasPending) {
    return MESSAGES_REGISTRY.AUTH.NO_PENDING_CHANNEL_CHANGE(
      otpIdentifierType || "Identifier",
    );
  }
  return null;
};

/**
 * Promotes a device record to trusted status by updating tracking markers.
 */
export const authorizeDeviceTrust = async (
  user: IUserDocument,
  deviceToken: string,
  userAgent: string,
): Promise<void> => {
  await upsertDevice({ user, deviceToken, userAgent });
};

/**
 * Unified orchestration service committing post-verification account state mutations based on purpose.
 */
export const executeAccountUpdate = async (
  input: ICommitAccountUpdateInput,
): Promise<ICommitAccountUpdateResult> => {
  const {
    identifier,
    purpose,
    verificationToken,
    verificationMethod,
    otpIdentifierType,
    deviceToken,
    userAgent,
    ipAddress,
  } = input;

  if (!identifier) {
    return {
      status: "MISSING_IDENTIFIER",
      transInfo: MESSAGES_REGISTRY.AUTH.MISSING_IDENTIFER,
    };
  }

  const user = await fetchSingleUser({
    identifier,
    flags: { lean: false, skipFilter: true },
  });

  let activeIdType = otpIdentifierType;

  if (verificationToken) {
    try {
      const tokenPayload = verifyOtpActionToken(verificationToken, purpose);
      if (tokenPayload.userId !== String(user?._id)) {
        return {
          status: "UNAUTHORIZED",
          transInfo: MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        };
      }
      activeIdType = tokenPayload.otpIdentifierType;
    } catch (err: any) {
      return {
        status: "BAD_REQUEST",
        transInfo: MESSAGES_REGISTRY.AUTH.UNKNOWN_SERVER_ERROR(err.message),
      };
    }
  }

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  switch (purpose) {
    case "IDENTIFIER_UPDATE": {
      const pendingErrorMsg = checkPendingIdentifier(user, activeIdType);
      if (pendingErrorMsg) {
        return {
          status: "BAD_REQUEST",
          transInfo: pendingErrorMsg,
        };
      }

      let updatedField: "EMAIL" | "PHONE_NUMBER" | null = null;

      if (activeIdType === "EMAIL" && user.pendingEmail) {
        updatedField = "EMAIL";
        user.email = user.pendingEmail;
        user.pendingEmail = null;
        user.isEmailVerified = true;
        user.lastEmailOtpSentAt = null;
      } else if (activeIdType === "PHONE_NUMBER" && user.pendingPhoneNumber) {
        updatedField = "PHONE_NUMBER";
        user.phoneNumber = user.pendingPhoneNumber;
        user.pendingPhoneNumber = null;
        user.isPhoneVerified = true;
        user.lastPhoneOtpSentAt = null;
      }

      await user.save();
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_RECORDS_UPDATED,
        payload: {
          identityUpdated: updatedField,
        },
      };
    }

    case "PASSWORD_RESET": {
      if (activeIdType === "EMAIL") {
        user.isEmailVerified = true;
        user.lastEmailOtpSentAt = null;
      } else {
        user.isPhoneVerified = true;
        user.lastPhoneOtpSentAt = null;
      }

      await user.save();

      await cleanDeviceSessions(String(user._id), undefined, {
        clearAll: true,
        preservePrimary: false,
      });

      return {
        status: "SUCCESS",
        payload: {
          loggedOut: true,
          clearLocalCookies: true,
          credentialUpdated: "PASSWORD",
        },
      };
    }

    case "LOGIN_VERIFICATION":
    case "SIGNUP_VERIFICATION": {
      if (deviceToken && userAgent) {
        await authorizeDeviceTrust(user, deviceToken, userAgent);
      }

      const device = await upsertDevice({
        user,
        deviceToken,
        userAgent,
      });
      const deviceIdString = device._id.toString();

      if (verificationMethod === "MESSAGING") {
        if (activeIdType === "EMAIL") {
          user.isEmailVerified = true;
          user.lastEmailOtpSentAt = null;
        } else {
          user.isPhoneVerified = true;
          user.lastPhoneOtpSentAt = null;
        }
      }
      user.lastActiveAt = new Date();

      const { accessToken, refreshToken } = await issueAuthTokens({
        user,
        deviceId: deviceIdString,
        sessionId: uuidv4(),
        userAgent,
        ipAddress,
        authTokens,
      });
      await user.save();

      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.ID_VERIFICATION_COMPLETED,
        payload: { channelVerified: activeIdType, accessToken, refreshToken },
      };
    }

    case "MFA_ACTIVATION": {
      if (user.hasEnabledMFA)
        return {
          status: "BAD_REQUEST",
          transInfo: MESSAGES_REGISTRY.AUTH.MFA_ALREADY_ENABLED,
        };
      user.hasEnabledMFA = true;
      await user.save();
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.MFA_ENABLED,
      };
    }

    case "MFA_DEACTIVATION": {
      if (user.hasEnabledMFA)
        return {
          status: "BAD_REQUEST",
          transInfo: MESSAGES_REGISTRY.AUTH.MFA_ALREADY_DISABLED,
        };
      user.hasEnabledMFA = false;
      await user.save();
      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.MFA_DISABLED,
      };
    }

    default: {
      return {
        status: "INVALID_PURPOSE",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_VERIFICATION_PURPOSE,
      };
    }
  }
};
