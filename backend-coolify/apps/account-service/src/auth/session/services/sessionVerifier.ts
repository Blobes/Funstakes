import { IDeviceDocument } from "@repo/database";
import {
  CACHE_KEYS,
  validateHardwareTrust,
  upsertDevice,
  userSensitiveFields,
  MESSAGES_REGISTRY,
  TransInfo,
  getCache,
  deleteCache,
  existsInCache,
  setCache,
  CACHE_EXPIRY,
  fetchSingleUser,
} from "@repo/shared";

interface IVerifySessionInput {
  userId?: string;
  sessionId?: string;
  jwtDeviceId?: string;
  deviceToken: string;
  userAgent: string;
}

interface IVerifySessionResult {
  status:
    | "SUCCESS"
    | "CONTEXT_MISSING"
    | "TRUST_EXPIRED"
    | "USER_NOT_FOUND"
    | "SESSION_MISMATCH"
    | "HARDWARE_MISMATCH"
    | "ANCHOR_ROTATED";
  transInfo?: TransInfo;
  payload?: any;
}

/**
 * Validates active session state, hardware fingerprints, and sliding window policies again.
 */
export const executeSessionVerification = async (
  input: IVerifySessionInput,
): Promise<IVerifySessionResult> => {
  const { userId, sessionId, jwtDeviceId, deviceToken, userAgent } = input;

  if (!userId || !sessionId || !jwtDeviceId) {
    return {
      status: "CONTEXT_MISSING",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_SESSION,
    };
  }

  const { isTrusted } = await validateHardwareTrust(
    userId,
    deviceToken,
    jwtDeviceId,
  );

  if (!isTrusted) {
    //  await deleteCache(CACHE_KEYS.USER_SESSION(userId, sessionId));
    return {
      status: "TRUST_EXPIRED",
      transInfo: MESSAGES_REGISTRY.AUTH.DEVICE_TRUST_EXPIRED,
    };
  }

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false },
  });

  if (!user) {
    await deleteCache(CACHE_KEYS.USER_SESSION(userId, sessionId));
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
  const sessionData = await getCache<IDeviceDocument>(sessionKey);

  if (!sessionData || sessionData.deviceToken !== jwtDeviceId) {
    return {
      status: "SESSION_MISMATCH",
      transInfo: MESSAGES_REGISTRY.AUTH.SESSIONS_EXPIRED,
    };
  }

  const device = await upsertDevice({ user, deviceToken, userAgent });
  if (device._id.toString() !== jwtDeviceId) {
    return {
      status: "HARDWARE_MISMATCH",
      transInfo: MESSAGES_REGISTRY.AUTH.HARDWARE_ID_MISMATCH,
    };
  }

  const sessionExists = await existsInCache(sessionKey);
  if (!sessionExists) {
    return {
      status: "ANCHOR_ROTATED",
      transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_ANCHOR_ROTATED,
    };
  }

  await setCache(
    sessionKey,
    {
      ...sessionData,
      lastActive: new Date(),
    },
    CACHE_EXPIRY.DAY_20,
  );

  user.lastActiveAt = new Date();
  user.save();

  const safePayload = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.SESSION_VALID,
    payload: safePayload,
  };
};
