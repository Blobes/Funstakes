import { DeviceModel, IDeviceDocument, IUserDocument } from "@repo/database";
import { UAParser } from "ua-parser-js";
import mongoose, { Types } from "mongoose";
import { cleanDeviceSessions } from "./session";
import { CACHE_EXPIRY, CACHE_KEYS } from "../constants/cacheKeys";
import { deleteCache, getOrSetCache } from "./redis/cache/helpers";

const TRUST_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days

// /**
//  * Determines if a device is known and within the trust window.
//  */
// export async function evaluateDeviceTrust(
//   device: IDeviceDocument | null,
// ): Promise<{
//   trusted: boolean;
//   reason?: "NEW_DEVICE" | "STALE_DEVICE";
// }> {
//   if (!device || !device.isVerified) {
//     return { trusted: false, reason: "NEW_DEVICE" };
//   }
//   const isStale =
//     Date.now() - new Date(device.lastSeenAt).getTime() > TRUST_WINDOW;
//   if (isStale) {
//     return { trusted: false, reason: "STALE_DEVICE" };
//   }
//   return { trusted: true };
// }

export interface DeviceUsertOptions {
  user: IUserDocument;
  targetDeviceId?: string;
  deviceToken?: string;
  userAgent?: string;
  session?: mongoose.ClientSession;
  markAsVerified?: boolean;
}
/**
 * Registers or updates a device and ensures a primary anchor exists.
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

  // 1. Try resolving by explicit targetDeviceId if provided
  if (targetDeviceId && mongoose.Types.ObjectId.isValid(targetDeviceId)) {
    device = await DeviceModel.findOne({
      _id: targetDeviceId,
      userId: user._id,
    }).session(session ?? null);
  }

  // 2. Fall back to resolving by deviceToken if no device was found
  if (!device && deviceToken) {
    device = await DeviceModel.findOne({
      userId: user._id,
      deviceToken,
    }).session(session ?? null);
  }

  const parser = new UAParser(userAgent);
  const ua = parser.getResult();

  if (!device) {
    const [newDevice] = await DeviceModel.create(
      [
        {
          userId: user._id,
          deviceToken,
          userAgent,
          deviceType: ua.device.type || "desktop",
          os: ua.os.name,
          browser: ua.browser.name,
          name: `${ua.os.name || "Unknown"} ${ua.browser.name || "Browser"}`,
        },
      ],
      { session },
    );
    device = newDevice;
  }

  device.lastSeenAt = new Date();

  if (markAsVerified) {
    device.isVerified = true;
  }

  await device.save({ session });

  await ensurePrimaryDevice(user, device._id, session);

  return device;
}

/**
 * Anchors the user's account to a primary device and revokes sessions on all demoted hardware.
 */
export async function ensurePrimaryDevice(
  user: IUserDocument,
  currentDeviceId?: string | Types.ObjectId,
  session?: mongoose.ClientSession,
): Promise<void> {
  if (user.primaryDeviceId) {
    const existingPrimary = await DeviceModel.findById(
      user.primaryDeviceId,
    ).session(session ?? null);
    // If we have a healthy primary anchor, no need to rotate.
    if (existingPrimary && !existingPrimary.isStale) return;
  }

  let primaryCandidate = null;

  // Prioritize the device currently in use.
  if (currentDeviceId) {
    primaryCandidate = await DeviceModel.findOne({
      _id: currentDeviceId,
      userId: user._id,
    }).session(session ?? null);
  }

  // Fallback to the most recent hardware in the registry.
  if (!primaryCandidate) {
    primaryCandidate = await DeviceModel.findOne({ userId: user._id })
      .sort({ lastSeenAt: -1 })
      .session(session ?? null);
  }

  if (primaryCandidate) {
    const candidateIdStr = primaryCandidate._id.toString();

    // 1. Find all other devices currently marked as primary (the demotion list).
    const demotedDevices = await DeviceModel.find({
      userId: user._id,
      isPrimary: true,
      _id: { $ne: primaryCandidate._id },
    })
      .select("_id")
      .session(session ?? null);

    const idsToClear = demotedDevices.map((d) => d._id.toString());

    // 2. Revoke all sessions for the old primaries and the new candidate.
    // We include the candidateIdStr to force a metadata sync in Redis on the next request.
    await cleanDeviceSessions(user._id.toString(), [
      ...idsToClear,
      candidateIdStr,
    ]);

    // 3. Database batch update: Ensure only the candidate is primary.
    await DeviceModel.updateMany(
      {
        userId: user._id,
        isPrimary: true,
        _id: { $ne: primaryCandidate._id },
      },
      { $set: { isPrimary: false } },
      { session },
    );

    primaryCandidate.isPrimary = true;
    primaryCandidate.isStale = false;
    user.primaryDeviceId = primaryCandidate._id as Types.ObjectId;

    await Promise.all([
      primaryCandidate.save({ session }),
      user.save({ session }),
    ]);
  }
}

interface ValidateDeviceResult {
  isTrusted: boolean;
  reason?: "NEW_DEVICE" | "STALE_DEVICE";
}
/**
 * Checks the Device Registry (via cache) to see if the device trust is still valid.
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

      const device = await DeviceModel.findOne({ userId, deviceToken });

      // Invalidate cache if device record is missing or mismatched
      if (!device || device._id.toString() !== jwtDeviceId) {
        await deleteCache(cacheKey);
        return { isTrusted: false };
      }

      if (!device.isVerified) {
        return { isTrusted: false, reason: "NEW_DEVICE" };
      }

      const isStale =
        Date.now() - new Date(device.lastSeenAt).getTime() > TRUST_WINDOW;
      if (isStale) {
        return { isTrusted: false, reason: "STALE_DEVICE" };
      }
      return { isTrusted: true };
    },
    CACHE_EXPIRY.MIN_2,
  );
};
