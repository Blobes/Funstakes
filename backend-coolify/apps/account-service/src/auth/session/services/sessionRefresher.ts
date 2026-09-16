import { authTokens } from "@/envVars";
import { issueAuthTokens } from "@repo/security";
import {
  CACHE_KEYS,
  IJwtUser,
  upsertDevice,
  MESSAGES_REGISTRY,
  TransInfo,
  setCache,
  CACHE_EXPIRY,
  existsInCache,
  getCache,
  fetchSingleUser,
  validateAccountStatus,
  RestrictionStatus,
} from "@repo/shared";
import jwt from "jsonwebtoken";

interface IRefreshSessionInput {
  refreshToken: string;
  deviceToken: string;
  userAgent: string;
}

interface IRefreshSessionResult {
  status?:
    | RestrictionStatus
    | "SUCCESS"
    | "INVALID_SESSION"
    | "USER_NOT_FOUND"
    | "HARDWARE_MISMATCH"
    | "ANCHOR_ROTATED";
  transInfo?: TransInfo;
  accessToken?: string;
}

/**
 * Validates the hardware session mapping state and generates an updated access token.
 */
export const executeSessionRefresh = async (
  input: IRefreshSessionInput,
): Promise<IRefreshSessionResult> => {
  const { refreshToken, deviceToken, userAgent } = input;

  try {
    const payload = jwt.verify(
      refreshToken,
      authTokens.REFRESH_TOKEN_SECRET,
    ) as IJwtUser;

    const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);
    const sessionData = (await getCache(sessionKey)) as any;

    if (!sessionData || sessionData.deviceId !== payload.deviceId) {
      return {
        status: "INVALID_SESSION",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_SESSION_MAPPING,
      };
    }

    const user = await fetchSingleUser({
      identifier: payload.id,
      flags: { lean: false },
    });

    if (!user) {
      return {
        status: "USER_NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    const { isRestricted, status, transInfo } = validateAccountStatus({
      accountStatus: user.accountStatus,
      mode: "RESTRICTED",
    });
    if (isRestricted) {
      return { status, transInfo };
    }

    const device = await upsertDevice({ user, deviceToken, userAgent });
    const deviceIdString = device._id.toString();

    if (deviceIdString !== payload.deviceId) {
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

    sessionData.lastActive = new Date();
    await setCache(sessionKey, sessionData, CACHE_EXPIRY.DAY_20);

    const { accessToken } = await issueAuthTokens({
      user,
      deviceId: deviceIdString,
      sessionId: payload.sessionId,
      authTokens,
    });

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.SESSION_REFRESHED,
      accessToken,
    };
  } catch (err: any) {
    throw new Error(
      err.message || MESSAGES_REGISTRY.AUTH.INVALID_TOKEN.message,
    );
  }
};
