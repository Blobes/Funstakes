import {
  hashCode,
  cleanDeviceSessions,
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  checkEmailReputation,
} from "@repo/shared";

interface IEmailChangeInput {
  userId: string;
  currentDeviceId?: string;
  code: string;
}

interface IEmailChangeResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "NO_PENDING_CHANGE"
    | "NO_ACTIVE_PROCESS"
    | "EXPIRED"
    | "INVALID_CODE";
  transInfo: TransInfo;
  payload?: {
    identifier: string;
    loggedOut: boolean;
  };
}

/**
 * Validates verification codes, updates active email state, and destroys secondary device sessions.
 */
export const executeEmailChange = async (
  input: IEmailChangeInput,
): Promise<IEmailChangeResult> => {
  const { userId, currentDeviceId, code } = input;

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false },
  });
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (!user.pendingEmail) {
    return {
      status: "NO_PENDING_CHANGE",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PENDING_EMAIL_CHANGE,
    };
  }

  if (!user.otpCode || !user.otpCodeExpiresAt) {
    return {
      status: "NO_ACTIVE_PROCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_ACTIVE_PROCESS,
    };
  }

  if (Date.now() > user.otpCodeExpiresAt.getTime()) {
    return {
      status: "EXPIRED",
      transInfo: MESSAGES_REGISTRY.AUTH.CODE_EXPIRED,
    };
  }

  if (hashCode(code) !== user.otpCode) {
    return {
      status: "INVALID_CODE",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CODE,
    };
  }

  // Finalize identity data points and clear registration markers
  user.email = user.pendingEmail;
  user.pendingEmail = null;
  user.isEmailVerified = true;
  user.lastEmailChangeAt = new Date();
  user.lastEmailOtpSentAt = null;
  user.otpCode = null;
  user.otpCodeExpiresAt = null;

  const hasVipEmail = await checkEmailReputation(user.email);
  (user.publicFigureInfo ??= {}).signals ??= {};
  user.publicFigureInfo.signals.hasVipEmail = hasVipEmail;

  await user.save();

  // Nuke unauthorized endpoints to prevent session hijacking
  await cleanDeviceSessions(String(userId), undefined, {
    clearAll: true,
    preservePrimary: true,
    primaryDeviceId: user.primaryDeviceId?.toString(),
  });

  const isCurrentDevicePrimary =
    currentDeviceId === user.primaryDeviceId?.toString();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_UPDATED_SESSIONS_ENDED,
    payload: { identifier: user.email, loggedOut: !isCurrentDevicePrimary },
  };
};
