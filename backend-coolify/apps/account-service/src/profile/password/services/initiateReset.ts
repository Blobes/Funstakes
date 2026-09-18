import { FUNSTAKES_REDIS_URL } from "@/envVars";
import {
  MESSAGES_REGISTRY,
  TransInfo,
  enqueueOtpTask,
  genVerificationCode,
  fetchSingleUser,
  detectIdentifierType,
  OtpMessageChannel,
  OtpIdentifierType,
  VerificationMethod,
  checkOtpCooldown,
  hashCode,
  validateAccountStatus,
} from "@repo/shared";

export interface IResetInitiationInput {
  identifier: string;
  otpChannelType?: OtpMessageChannel;
  resetMethod?: VerificationMethod;
  userIp?: string;
}

export interface IResetInitiationResult {
  status?:
    | "SUCCESS"
    | "MISSING_IDENTIFIER"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_IDENTIFIER"
    | "RATE_LIMIT_ACTIVE";
  transInfo?: TransInfo;
  payload: {
    identifier?: string;
    identifierType?: OtpIdentifierType;
    resetMethod?: VerificationMethod;
    retryAfter?: number | null;
  } | null;
}

/**
 * Handles account tracking checks and schedules transaction challenge dispatches for profile security resets.
 */
export const executeResetInitiation = async (
  input: IResetInitiationInput,
): Promise<IResetInitiationResult> => {
  const {
    identifier,
    otpChannelType = "EMAIL",
    resetMethod = "MESSAGING",
    userIp,
  } = input;

  if (!identifier) {
    return {
      status: "MISSING_IDENTIFIER",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
      payload: null,
    };
  }

  const isEmail = detectIdentifierType(identifier) === "EMAIL";
  const isPhone = detectIdentifierType(identifier) === "PHONE_NUMBER";

  if (!isEmail && !isPhone) {
    return {
      status: "INVALID_IDENTIFIER",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_EMAIL_OR_PHONE,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier,
    select: ["+password", "email", "phoneNumber", "accountStatus"],
    flags: {
      lean: false,
      skipFilter: true,
    },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: isEmail
        ? MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND
        : MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND,
      payload: null,
    };
  }

  const accountStatus = user.accountStatus;
  const { isRestricted, transInfo } = validateAccountStatus({
    accountStatus: accountStatus,
    mode: "RESTRICTED",
  });
  if (isRestricted) {
    return {
      status: "RESTRICTION",
      transInfo,
      payload: null,
    };
  }

  // Enforce single-minute delay window on messaging
  if (user.lastEmailOtpSentAt || user.lastPhoneOtpSentAt) {
    const lastSentAt = isEmail
      ? user.lastEmailOtpSentAt
      : user.lastPhoneOtpSentAt;

    const cooldown = checkOtpCooldown({ lastSentAt });
    if (cooldown.isCooldownActive) {
      return {
        status: "RATE_LIMIT_ACTIVE",
        transInfo: cooldown.transInfo,
        payload: {
          retryAfter: cooldown.retryAfter || 0,
        },
      };
    }
  }

  const code = genVerificationCode();
  user.otpCode = hashCode(code);
  user.otpCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 15);

  if (isEmail) {
    user.lastEmailOtpSentAt = new Date();
  } else {
    user.lastPhoneOtpSentAt = new Date();
  }
  await user.save();

  if (resetMethod === "MESSAGING") {
    if (otpChannelType === "EMAIL") {
      await enqueueOtpTask(
        {
          email: user.email,
          code,
          type: "EMAIL",
          firstName: user.firstName,
          userIp,
        },
        FUNSTAKES_REDIS_URL,
      );
    } else if (otpChannelType === "WHATSAPP") {
      await enqueueOtpTask(
        {
          phone: user.phoneNumber,
          code,
          type: "WHATSAPP",
          firstName: user.firstName,
          userIp,
        },
        FUNSTAKES_REDIS_URL,
      );
    } else {
      await enqueueOtpTask(
        {
          phone: user.phoneNumber,
          code,
          type: "SMS",
          firstName: user.firstName,
          userIp,
        },
        FUNSTAKES_REDIS_URL,
      );
    }
  }

  const resetDestination = isEmail ? user.email : user.phoneNumber;

  return {
    status: "SUCCESS",
    transInfo:
      resetMethod === "MESSAGING"
        ? MESSAGES_REGISTRY.AUTH.PASSWORD_RESET_INITIATED_VIA_MESSAGING(
            otpChannelType,
          )
        : MESSAGES_REGISTRY.AUTH.PASSWORD_RESET_INITIATED,
    payload: {
      identifier: resetDestination || "",
      identifierType: isEmail ? "EMAIL" : "PHONE_NUMBER",
      resetMethod,
    },
  };
};
