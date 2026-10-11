import { DEVICE_NESTED_FIELDS, DeviceModel } from "@repo/database";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  forwardError,
  getOrSetCache,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Fetches user hardware devices and projects only the requesting user's meta context.
 */
export const getDevices = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  try {
    const cacheKey = CACHE_KEYS.WILDCARD_DEVICES(userId);

    const devices = await getOrSetCache(
      cacheKey,
      async () => {
        return await DeviceModel.find(
          { [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId },
          {
            deviceToken: 1,
            name: 1,
            deviceType: 1,
            os: 1,
            browser: 1,
            userAgent: 1,
            lastSeenAt: 1,
            isStale: 1,
            users: { $elemMatch: { userId } },
          },
        )
          .sort({ lastSeenAt: -1 })
          .lean();
      },
      CACHE_EXPIRY.HOUR_1,
    );

    res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.DEVICES_RETRIEVED,
      payload: devices,
    });
    return;
  } catch (error: unknown) {
    console.error("Get Device Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
