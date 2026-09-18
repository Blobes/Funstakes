import { FUNSTAKES_REDIS_URL } from "@/envVars";
import {
  evaluateNotability,
  genVerificationCode,
  hashCode,
  enqueueOtpTask,
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  OtpMessageChannel,
  checkOtpCooldown,
} from "@repo/shared";

interface IInitiatePhoneChangeInput {
  userId: string;
  newPhoneNumber: string;
  otpChannelType?: OtpMessageChannel;
  userIp?: string;
}

interface IInitiatePhoneChangeResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "PHONE_COOLDOWN_ACTIVE"
    | "RATE_LIMIT_ACTIVE"
    | "PHONE_ALREADY_USED"
    | "PHONE_CONFLICT";
  transInfo?: TransInfo;
  daysRemaining?: number;
  secondsToWait?: number;
  payload?: any;
}

/**
 * Checks infrastructure change cooldowns, updates pending profile vectors, and registers a verification task inside Redis.
 */
export const startPhoneChange = async (
  input: IInitiatePhoneChangeInput,
): Promise<IInitiatePhoneChangeResult> => {
  const { userId, newPhoneNumber, otpChannelType = "WHATSAPP", userIp } = input;
  const CHANGE_COOLDOWN = 90 * 24 * 60 * 60 * 1000;

  const user = await fetchSingleUser({
    identifier: userId,
    flags: {
      lean: false,
    },
  });
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Enforce 90-day cooldown constraint on primary identification tokens
  if (user.lastPhoneChangeAt) {
    const timeSinceLastChange = Date.now() - user.lastPhoneChangeAt.getTime();
    if (timeSinceLastChange < CHANGE_COOLDOWN) {
      const daysRemaining = Math.ceil(
        (CHANGE_COOLDOWN - timeSinceLastChange) / (1000 * 60 * 60 * 24),
      );
      return {
        status: "PHONE_COOLDOWN_ACTIVE",
        transInfo: MESSAGES_REGISTRY.AUTH.COOLDOWN_ACTIVE(daysRemaining),
        daysRemaining,
      };
    }
  }

  // Enforce single-minute delay window on messaging gateways
  if (user.lastPhoneOtpSentAt) {
    const cooldown = checkOtpCooldown({ lastSentAt: user.lastPhoneOtpSentAt });
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

  const formattedPhone = newPhoneNumber.trim();

  if (user.phoneNumber === formattedPhone) {
    return {
      status: "PHONE_ALREADY_USED",
      transInfo: MESSAGES_REGISTRY.AUTH.PHONE_ALREADY_USED,
    };
  }

  // Cross-reference registry records across soft-delete criteria bounds
  const existingPhoneUser = await fetchSingleUser({
    identifier: formattedPhone,
    query: { _id: { $ne: userId } },
    flags: {
      lean: false,
      identifierType: "PHONE_NUMBER",
      skipFilter: true,
    },
  });

  if (existingPhoneUser) {
    return {
      status: "PHONE_CONFLICT",
      transInfo: MESSAGES_REGISTRY.AUTH.PHONE_CONFLICT,
    };
  }

  // Recalculate platform notability indicators using incoming carrier signatures
  const fullName = `${user.firstName} ${user.lastName}`;
  const notability = await evaluateNotability(
    fullName,
    user.email,
    formattedPhone,
  );

  const code = genVerificationCode();

  user.pendingPhoneNumber = formattedPhone;
  user.otpCode = hashCode(code);
  user.otpCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.lastPhoneOtpSentAt = new Date();

  user.meritsVerification = notability.isVIPCandidate;
  user.isNotable = notability.isVIPCandidate;
  user.verificationSignals = {
    hasWikipedia: notability.signals.notableName,
    isVipEmail: notability.signals.proEmail,
    isVipPhone: notability.signals.validPhone,
  };

  await user.save();

  // Forward code dispatch instructions to worker processors
  if (otpChannelType === "WHATSAPP") {
    await enqueueOtpTask(
      {
        phone: formattedPhone,
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
        phone: formattedPhone,
        code,
        type: "SMS",
        firstName: user.firstName,
        userIp,
      },
      FUNSTAKES_REDIS_URL,
    );
  }

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.AUTH.VERIFICATION_WILL_BE_CODE_SENT_TO_PHONE(
        otpChannelType,
      ),
    payload: {
      pendingPhoneNumber: user.pendingPhoneNumber,
      expiresAt: user.otpCodeExpiresAt,
      meritsVerification: user.meritsVerification,
    },
  };
};
