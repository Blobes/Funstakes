import { DEVICE_NESTED_FIELDS, DeviceModel } from "@repo/database";
import { clearAuthCookies } from "@repo/security";
import {
  cleanDeviceSessions,
  ensurePrimaryDevice,
  fetchSingleUser,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Removes user device link using atomic $pull or deletes document if no users remain.
 */
export const removeDevice = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id!;
  const currentDeviceId = req.user?.deviceId;
  const { id } = req.params;

  try {
    const device = await DeviceModel.findOne({
      _id: id,
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId,
    });

    if (!device) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.DEACTIVATED_NOT_FOUND,
      });
    }

    await cleanDeviceSessions(userId, id);

    const userMeta = device.users.find((u) => u.userId.toString() === userId);
    const wasPrimary = userMeta?.isPrimary ?? false;
    const isCurrentDevice = id === currentDeviceId;

    // Atomically remove user subdocument entry using $pull with string constant path
    const updatedDevice = await DeviceModel.findByIdAndUpdate(
      id,
      { $pull: { users: { userId } } },
      { new: true },
    );

    // Purge document if no users remain
    if (!updatedDevice || updatedDevice.users.length === 0) {
      await DeviceModel.findByIdAndDelete(id);
    }

    if (wasPrimary) {
      const user = await fetchSingleUser({
        identifier: userId,
        flags: { lean: false },
      });

      if (user) {
        user.primaryDeviceId = null;
        await ensurePrimaryDevice(user, currentDeviceId?.toString());
      }
    }

    if (isCurrentDevice) {
      clearAuthCookies(res);
      return res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.AUTH.DEVICE_SESSION_TERMINATED,
        payload: { logout: true },
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.DEVICE_REMOVED,
    });
  } catch (error: any) {
    console.error("Remove Device Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
