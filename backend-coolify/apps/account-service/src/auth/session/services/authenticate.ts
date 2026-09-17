import mongoose from "mongoose";
import { authTokens } from "@/envVars";
import { IUserDocument } from "@repo/database";
import {
  userSensitiveFields,
  CACHE_KEYS,
  upsertDevice,
  MESSAGES_REGISTRY,
  TransInfo,
  setCache,
  sanitizeUserResult,
  fetchSingleUser,
  validateAccountStatus,
  RestrictionStatus,
  validateHardwareTrust,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { executeAccountCheck } from "../../check/service";
import { verifyEncryptedPass } from "@/auth/helpers/encrypt";
import { issueAuthTokens } from "@repo/security";
import { syncDefaultRole } from "../../helpers/syncRole";

interface ILoginInput {
  identifier: string;
  password: string;
  deviceToken: string;
  userAgent: string;
  ipAddress: string;
}

interface ILoginResult {
  status?:
    | RestrictionStatus
    | "SUCCESS"
    | "USER_NOT_FOUND"
    | "NO_USER_PASSWORD_SET"
    | "UNAUTHORIZED"
    | "THIRD_PARTY_RESTRICTION";
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  deviceId?: string;
  payload?: any;
  requireVerification?: boolean;
  verificationReason?: "UNVERIFIED_ACCOUNT" | "UNTRUSTED_DEVICE";
}

const TRUST_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Executes the login business logic including credential comparison, device registry, and session generation.
 */
export const authenticateUser = async (
  input: ILoginInput,
): Promise<ILoginResult> => {
  const { identifier, password, deviceToken, userAgent, ipAddress } = input;

  // Reusing validation rules and third-party restrictions from service check layer
  const checkResult = await executeAccountCheck({
    identifier,
    purpose: "LOGIN",
  });

  if (checkResult.status === "NOT_FOUND") {
    return {
      status: "USER_NOT_FOUND",
      transInfo: { ...checkResult.transInfo },
    };
  }

  if (checkResult.status === "THIRD_PARTY_RESTRICTION") {
    return {
      status: "THIRD_PARTY_RESTRICTION",
      transInfo: { ...checkResult.transInfo },
    };
  }

  const accountStatus = checkResult.payload?.accountStatus;
  const { isRestricted, status, transInfo } = validateAccountStatus({
    accountStatus: accountStatus,
    mode: "RESTRICTED",
  });
  if (isRestricted) {
    return { status, transInfo };
  }

  // Fetch user payload bypassing filters and retaining sensitive fields for authentication
  const user = await fetchSingleUser({
    identifier: checkResult.payload?.userId,
    flags: {
      lean: false,
      includeLanguage: true,
      skipFilter: true,
      includeSensitiveFields: true,
    },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  const userPassword = user.password;
  if (!userPassword) {
    return {
      status: "NO_USER_PASSWORD_SET",
      transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
    };
  }

  const isMatch = await verifyEncryptedPass(password, userPassword);
  if (!isMatch) {
    return {
      status: "UNAUTHORIZED",
      transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
    };
  }

  const userId = user._id.toString();

  // Ensure default role and subscription are present before issuing session state
  await syncDefaultRole(user._id);

  const device = await upsertDevice({
    user: user as IUserDocument,
    deviceToken,
    userAgent,
  });

  const deviceIdString = device._id.toString();

  const primaryDeviceId = user.primaryDeviceId as
    | mongoose.Types.ObjectId
    | undefined;

  await setCache(
    CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
    primaryDeviceId?.toString(),
  );

  const { isTrusted: isDeviceTrusted } = await validateHardwareTrust(
    userId,
    deviceToken,
    deviceIdString,
  );

  const isVerified =
    Boolean(user.isEmailVerified) || Boolean(user.isPhoneVerified);

  const lastActive = user.lastActiveAt || user.createdAt;

  let isInactive;
  if (lastActive)
    isInactive = Date.now() - new Date(lastActive).getTime() > TRUST_WINDOW;

  const requireVerification = !isVerified || !isDeviceTrusted || isInactive;

  const now = new Date();
  user.lastPasswordVerifiedAt = now;

  let accessToken, refreshToken;
  if (!requireVerification) {
    const tokens = await issueAuthTokens({
      user,
      deviceId: deviceIdString,
      sessionId: uuidv4(),
      userAgent,
      ipAddress,
      authTokens,
    });
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    user.lastActiveAt = now;
  }

  user.save();

  const safeData = sanitizeUserResult(user, userSensitiveFields());

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.LOGGED_IN_SUCCESSFULLY,
    accessToken,
    refreshToken,
    payload: safeData,
    deviceId: deviceIdString,
    requireVerification,
    verificationReason: requireVerification
      ? !isVerified
        ? "UNVERIFIED_ACCOUNT"
        : "UNTRUSTED_DEVICE"
      : undefined,
  };
};
