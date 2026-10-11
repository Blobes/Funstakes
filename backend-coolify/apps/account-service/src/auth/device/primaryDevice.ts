import { DEVICE_NESTED_FIELDS, DeviceModel, UserModel } from "@repo/database";
import {
  checkUserExists,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Response } from "express";

/**
 * Manually promotes device to primary for authenticated user using atomic updates.
 */
export const setPrimaryDevice = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const userExists = await checkUserExists({
      identifier: userId,
    });

    if (!userExists) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
        payload: null,
      });
    }

    const targetDevice = await DeviceModel.findOne({
      _id: id,
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId,
    });

    if (!targetDevice) {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.DEVICE_NOT_FOUND,
        payload: null,
      });
    }

    // Demote existing primary entries for this user atomically
    await DeviceModel.updateMany(
      {
        [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId,
        [DEVICE_NESTED_FIELDS.USERS_IS_PRIMARY]: true,
      },
      { $set: { [DEVICE_NESTED_FIELDS.USERS_POSITIONAL_IS_PRIMARY]: false } },
    );

    // Promote new primary entry for this user atomically
    const updatedDevice = await DeviceModel.findOneAndUpdate(
      { _id: id, [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId },
      {
        $set: {
          [DEVICE_NESTED_FIELDS.USERS_POSITIONAL_IS_PRIMARY]: true,
          isStale: false,
        },
      },
      { new: true },
    );

    await UserModel.findByIdAndUpdate(userId, {
      $set: { primaryDeviceId: targetDevice._id },
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.PRIMARY_DEVICE_UPDATED,
      payload: updatedDevice,
    });
  } catch (error: unknown) {
    console.error("Set Primary Device Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
