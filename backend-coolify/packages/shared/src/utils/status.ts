import { AccountStatus, ModerationDecision } from "@repo/database";
import { AppName, TransInfo } from "../types/general";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";

interface ICheckCooldownParams {
  lastSentAt?: Date | null;
  cooldownSeconds?: number;
}
interface ICooldownCheckResult {
  isCooldownActive: boolean;
  retryAfter?: number;
  transInfo?: TransInfo;
}

export type RestrictionStatus =
  | "ACCOUNT_ACTIVE"
  | "ACCOUNT_INACTIVE"
  | ModerationDecision;

export type RestrictionMode = "RESTRICTED" | "NORMAL";

export interface AccountRestriction {
  accountStatus?: AccountStatus;
  mode?: RestrictionMode;
}

export interface IRestrictionResult {
  isRestricted: boolean;
  status?: RestrictionStatus;
  transInfo?: TransInfo;
}

const DEFAULT_COOLDOWN_SECONDS = 60;

export const healthCheck = (serviceName: AppName) => {
  console.log(`${serviceName} is Live"`);
  return {
    status: "Ok",
    timestamp: new Date().toISOString(),
    service: serviceName,
  };
};

export const getAccountStatusMsg = (
  status: AccountStatus,
  mode: "RESTRICTED" | "NORMAL" = "NORMAL",
): {
  status: RestrictionStatus;
  transInfo: TransInfo;
} => {
  if (mode === "RESTRICTED") {
    if (status === "DEACTIVATED") {
      return {
        status: "ACCOUNT_DEACTIVATED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
      };
    }
    if (status === "SUSPENDED") {
      return {
        status: "ACCOUNT_SUSPENDED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_SUSPENDED,
      };
    }
    if (status === "BANNED") {
      return {
        status: "ACCOUNT_BANNED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_BANNED,
      };
    }
  }
  if (status === "INACTIVE") {
    return {
      status: "ACCOUNT_INACTIVE",
      transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_INACTIVE,
    };
  }
  return {
    status: "ACCOUNT_ACTIVE",
    transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_ACTIVE,
  };
};

/**
 * Checks if an OTP dispatch rate-limit cooldown period is active.
 */
export const checkOtpCooldown = ({
  lastSentAt,
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
}: ICheckCooldownParams): ICooldownCheckResult => {
  if (!lastSentAt) {
    return { isCooldownActive: false };
  }

  const elapsedSeconds = (Date.now() - new Date(lastSentAt).getTime()) / 1000;

  if (elapsedSeconds < cooldownSeconds) {
    const secondsLeft = Math.ceil(cooldownSeconds - elapsedSeconds);
    return {
      isCooldownActive: true,
      retryAfter: secondsLeft,
      transInfo: MESSAGES_REGISTRY.AUTH.RATE_LIMIT_ACTIVE(secondsLeft),
    };
  }

  return { isCooldownActive: false };
};

/**
 * Evaluates account status and returns restriction status with localized messages.
 */
export const validateAccountStatus = (
  options: AccountRestriction,
): IRestrictionResult => {
  const { accountStatus, mode = "RESTRICTED" } = options;

  if (
    accountStatus === "DEACTIVATED" ||
    accountStatus === "SUSPENDED" ||
    accountStatus === "BANNED"
  ) {
    const restrictionMsg = getAccountStatusMsg(accountStatus, mode);
    return {
      isRestricted: true,
      status: restrictionMsg.status,
      transInfo: restrictionMsg.transInfo,
    };
  }

  return { isRestricted: false };
};
