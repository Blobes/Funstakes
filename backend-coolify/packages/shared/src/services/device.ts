import {
  DEVICE_NESTED_FIELDS,
  DeviceModel,
  IDeviceDocument,
  IUserDocument,
} from "@repo/database";
import { UAParser } from "ua-parser-js";
import mongoose, { Types } from "mongoose";
import { cleanDeviceSessions } from "./session";
import { CACHE_EXPIRY, CACHE_KEYS } from "../constants/cacheKeys";
import { deleteCache, getOrSetCache } from "./redis/cache/helpers";

const TRUST_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface DeviceUsertOptions {
  user: IUserDocument;
  targetDeviceId?: string;
  deviceToken?: string;
  userAgent?: string;
  session?: mongoose.ClientSession;
  markAsVerified?: boolean;
}

/**
 * Registers or updates a shared device using atomic array operations.
 */
export async function upsertDevice(
  options: DeviceUsertOptions,
): Promise<IDeviceDocument> {
  const {
    user,
    targetDeviceId,
    deviceToken,
    userAgent,
    session,
    markAsVerified = false,
  } = options;

  let device: IDeviceDocument | null = null;

  // 1. Try resolving by targetDeviceId if provided
  if (targetDeviceId && mongoose.Types.ObjectId.isValid(targetDeviceId)) {
    device = await DeviceModel.findOne({
      _id: targetDeviceId,
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
    }).session(session ?? null);
  }

  // 2. Fall back to resolving by deviceToken across all registered users
  if (!device && deviceToken) {
    device = await DeviceModel.findOne({ deviceToken }).session(
      session ?? null,
    );
  }

  const parser = new UAParser(userAgent);
  const ua = parser.getResult();

  if (!device) {
    // Atomic creation if physical hardware record does not exist
    const [newDevice] = await DeviceModel.create(
      [
        {
          users: [
            {
              userId: user._id,
              isPrimary: false,
              isVerified: markAsVerified,
            },
          ],
          deviceToken,
          userAgent,
          deviceType: ua.device.type || "desktop",
          os: ua.os.name,
          browser: ua.browser.name,
          name: `${ua.os.name || "Unknown"} ${ua.browser.name || "Browser"}`,
          lastSeenAt: new Date(),
        },
      ],
      { session },
    );
    device = newDevice;
  } else {
    // Atomic update using positional and $push operators
    const hasUser = device.users.some((u) => u.userId.equals(user._id));

    if (!hasUser) {
      // Add user metadata entry atomically if it doesn't exist
      device = await DeviceModel.findByIdAndUpdate(
        device._id,
        {
          $push: {
            users: {
              userId: user._id,
              isPrimary: false,
              isVerified: markAsVerified,
            },
          },
          $set: { lastSeenAt: new Date() },
        },
        { new: true, session },
      );
    } else {
      // Update existing user entry positional fields atomically
      const updateFields: Record<string, any> = {
        lastSeenAt: new Date(),
      };

      if (markAsVerified) {
        updateFields[DEVICE_NESTED_FIELDS.USERS_POSITIONAL_IS_VERIFIED] = true;
      }

      device = await DeviceModel.findOneAndUpdate(
        { _id: device._id, [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id },
        { $set: updateFields },
        { new: true, session },
      );
    }
  }

  if (device) {
    await ensurePrimaryDevice(user, device._id, session);
  }

  return device!;
}

/**
 * Anchors the user's account to a primary device and demotes other primary devices for this user.
 */
export async function ensurePrimaryDevice(
  user: IUserDocument,
  currentDeviceId?: string | Types.ObjectId,
  session?: mongoose.ClientSession,
): Promise<void> {
  if (user.primaryDeviceId) {
    const existingPrimary = await DeviceModel.findOne({
      _id: user.primaryDeviceId,
      users: {
        $elemMatch: { userId: user._id, isPrimary: true },
      },
    }).session(session ?? null);

    if (existingPrimary && !existingPrimary.isStale) return;
  }

  let primaryCandidate = null;

  if (currentDeviceId) {
    primaryCandidate = await DeviceModel.findOne({
      _id: currentDeviceId,
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
    }).session(session ?? null);
  }

  if (!primaryCandidate) {
    primaryCandidate = await DeviceModel.findOne({
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
    })
      .sort({ lastSeenAt: -1 })
      .session(session ?? null);
  }

  if (primaryCandidate) {
    const candidateIdStr = primaryCandidate._id.toString();

    // 1. Find demoted devices for this specific user
    const demotedDevices = await DeviceModel.find({
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
      [DEVICE_NESTED_FIELDS.USERS_IS_PRIMARY]: true,
      _id: { $ne: primaryCandidate._id },
    })
      .select("_id")
      .session(session ?? null);

    const idsToClear = demotedDevices.map((d) => d._id.toString());

    // 2. Revoke active sessions
    await cleanDeviceSessions(user._id.toString(), [
      ...idsToClear,
      candidateIdStr,
    ]);

    // 3. Demote all existing primary flags for this user atomically using $ positional operator
    await DeviceModel.updateMany(
      {
        [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
        [DEVICE_NESTED_FIELDS.USERS_IS_PRIMARY]: true,
        _id: { $ne: primaryCandidate._id },
      },
      { $set: { [DEVICE_NESTED_FIELDS.USERS_POSITIONAL_IS_PRIMARY]: false } },
      { session },
    );

    // 4. Promote candidate device for this user atomically
    await DeviceModel.updateOne(
      {
        _id: primaryCandidate._id,
        [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
      },
      {
        $set: {
          [DEVICE_NESTED_FIELDS.USERS_POSITIONAL_IS_PRIMARY]: true,
          isStale: false,
        },
      },
      { session },
    );

    user.primaryDeviceId = primaryCandidate._id as Types.ObjectId;
    await user.save({ session });
  }
}

interface ValidateDeviceResult {
  isTrusted: boolean;
  reason?: "NEW_DEVICE" | "STALE_DEVICE";
}

/**
 * Validates device trust using cached subdocument metadata checks.
 */
export const validateDeviceTrust = async (
  userId: string,
  deviceToken: string | undefined,
  jwtDeviceId: string,
): Promise<ValidateDeviceResult> => {
  const cacheKey = CACHE_KEYS.DEVICE_TRUST_STATUS(
    userId,
    deviceToken || "none",
  );

  return await getOrSetCache<ValidateDeviceResult>(
    cacheKey,
    async () => {
      if (!deviceToken) return { isTrusted: false };

      const device = await DeviceModel.findOne({
        deviceToken,
        [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId,
      });

      if (!device || device._id.toString() !== jwtDeviceId) {
        await deleteCache(cacheKey);
        return { isTrusted: false };
      }

      const userMeta = device.users.find((u) => u.userId.toString() === userId);

      if (!userMeta || !userMeta.isVerified) {
        return { isTrusted: false, reason: "NEW_DEVICE" };
      }

      const isStale =
        Date.now() - new Date(device.lastSeenAt).getTime() > TRUST_WINDOW;
      if (isStale) {
        return { isTrusted: false, reason: "STALE_DEVICE" };
      }
      return { isTrusted: true };
    },
    CACHE_EXPIRY.MIN_5,
  );
};
