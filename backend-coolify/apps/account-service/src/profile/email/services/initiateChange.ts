import { FUNSTAKES_REDIS_URL } from "@/envVars";
import {
  evaluateNotability,
  genVerificationCode,
  hashCode,
  enqueueOtpTask,
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  checkUserExists,
  checkOtpCooldown,
} from "@repo/shared";
import { verifyEncryptedPass } from "@/auth/helpers/encrypt";

interface IInitiateEmailChangeInput {
  userId: string;
  newEmail: string;
  password?: string;
  userIp?: string;
}

interface IInitiateEmailChangeResult {
  status:
    | "SUCCESS"
    | "NOT_FOUND"
    | "PASSWORD_REQUIRED"
    | "NO_USER_PASSWORD_SET"
    | "INCORRECT_PASSWORD"
    | "EMAIL_COOLDOWN_ACTIVE"
    | "RATE_LIMIT_ACTIVE"
    | "EMAIL_ALREADY_USED"
    | "EMAIL_CONFLICT";
  transInfo?: TransInfo;
  daysRemaining?: number;
  retryAfter?: number | null;
  payload?: unknown;
}

/**
 * Validates cooldown limits, checks password status, and enqueues confirmation codes to change profile emails.
 */
export const startEmailChange = async (
  input: IInitiateEmailChangeInput,
): Promise<IInitiateEmailChangeResult> => {
  const { userId, newEmail, password, userIp } = input;
  const GRACE_PERIOD_MS = 15 * 60 * 1000;
  const ALLOWED_NO_OF_DAYS = 30 * 24 * 60 * 60 * 1000;

  const user = await fetchSingleUser({
    identifier: userId,
    select: ["+password"],
    flags: { lean: false, skipFilter: true },
  });
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Evaluate credential lifespan metrics before enforcing account updates
  const lastVerified = user.lastPasswordVerifiedAt
    ? new Date(user.lastPasswordVerifiedAt).getTime()
    : 0;
  const isGracePeriodActive = Date.now() - lastVerified < GRACE_PERIOD_MS;

  if (!isGracePeriodActive) {
    if (!password) {
      return {
        status: "PASSWORD_REQUIRED",
        transInfo: MESSAGES_REGISTRY.AUTH.CURRENT_PASSWORD_REQUIRED,
      };
    }
    if (!user.password) {
      return {
        status: "NO_USER_PASSWORD_SET",
        transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
      };
    }
    const isMatch = await verifyEncryptedPass(password, user.password);
    if (!isMatch) {
      return {
        status: "INCORRECT_PASSWORD",
        transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
      };
    }
    user.lastPasswordVerifiedAt = new Date();
  }

  // Enforce 30-day structural infrastructure changes spacing rule
  if (user.lastEmailChangeAt) {
    const timeSinceLastChange = Date.now() - user.lastEmailChangeAt.getTime();
    if (timeSinceLastChange < ALLOWED_NO_OF_DAYS) {
      const daysRemaining = Math.ceil(
        (ALLOWED_NO_OF_DAYS - timeSinceLastChange) / (1000 * 60 * 60 * 24),
      );
      return {
        status: "EMAIL_COOLDOWN_ACTIVE",
        transInfo: MESSAGES_REGISTRY.AUTH.COOLDOWN_ACTIVE(daysRemaining),
        daysRemaining,
      };
    }
  }

  // Enforce single-minute delay window on messaging gateways
  if (user.lastEmailOtpSentAt) {
    const cooldown = checkOtpCooldown({ lastSentAt: user.lastEmailOtpSentAt });
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

  const formattedEmail = newEmail.toLowerCase().trim();
  if (user.email === formattedEmail) {
    return {
      status: "EMAIL_ALREADY_USED",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_USED,
    };
  }

  // Scan database registry index records, bypassing global soft delete scoping rules
  const existingEmailUser = await checkUserExists({
    query: {
      email: formattedEmail,
      _id: { $ne: userId },
    },
    flags: { skipFilter: true },
  });

  if (existingEmailUser) {
    return {
      status: "EMAIL_CONFLICT",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_CONFLICT,
    };
  }

  // Fetch verified profile status indicators from context targets
  const fullName = `${user.firstName} ${user.lastName}`;
  const notability = await evaluateNotability(
    fullName,
    formattedEmail,
    user.phoneNumber || undefined,
  );

  const code = genVerificationCode();
  const now = new Date();

  user.pendingEmail = formattedEmail;
  user.otpCode = hashCode(code);
  user.otpCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.lastEmailOtpSentAt = now;

  user.meritsVerification = notability.isVIPCandidate;
  user.isNotable = notability.isVIPCandidate;
  user.verificationSignals = {
    hasWikipedia: notability.signals.notableName,
    isVipEmail: notability.signals.proEmail,
    isVipPhone: notability.signals.validPhone,
  };

  await user.save();

  // Forward code dispatch instructions to worker processors
  await enqueueOtpTask(
    {
      email: formattedEmail,
      code,
      type: "EMAIL",
      firstName: user.firstName,
      userIp,
    },
    FUNSTAKES_REDIS_URL,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.VERIFICATION_CODE_WILL_BE_SENT_TO_EMAIL,
    payload: {
      pendingEmail: user.pendingEmail,
      expiresAt: user.otpCodeExpiresAt,
      meritsVerification: user.meritsVerification,
    },
  };
};
