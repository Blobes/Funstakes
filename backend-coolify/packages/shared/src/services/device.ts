import { DeviceModel, IDeviceDocument, IUserDocument } from "@repo/database";
import { UAParser } from "ua-parser-js";
import { Request } from "express";
import mongoose, { Types } from "mongoose";
import { cleanDeviceSessions } from "./session";
import { CACHE_KEYS } from "../constants/cacheKeys";
import { getOrSetCache } from "./redis/cache/helpers";

const TRUST_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Resolves a device record based on the user ID and the unique device token.
 */
export async function resolveDevice(
  userId: Types.ObjectId | string,
  deviceToken: string | undefined,
  req: Request,
): Promise<IDeviceDocument | null> {
  // Return null immediately if no token is provided in the request
  if (!deviceToken) return null;

  return await DeviceModel.findOne({ userId, deviceToken });
}

/**
 * Determines if a device is known and within the trust window.
 */
export async function evaluateDeviceTrust(
  device: IDeviceDocument | null,
): Promise<{
  trusted: boolean;
  reason?: "NEW_DEVICE" | "STALE_DEVICE";
}> {
  if (!device) {
    return { trusted: false, reason: "NEW_DEVICE" };
  }
  const isStale =
    Date.now() - new Date(device.lastVerifiedAt).getTime() > TRUST_WINDOW;
  if (isStale) {
    return { trusted: false, reason: "STALE_DEVICE" };
  }
  return { trusted: true };
}

interface DeviceUsertOptions {
  user: IUserDocument;
  deviceToken?: string;
  userAgent: string;
  session?: mongoose.ClientSession;
}
/**
 * Registers or updates a device and ensures a primary anchor exists.
 */
export async function upsertDevice(
  options: DeviceUsertOptions,
): Promise<IDeviceDocument> {
  const { user, deviceToken, userAgent, session } = options;

  let device = await DeviceModel.findOne({
    userId: user._id,
    deviceToken,
  }).session(session ?? null);

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
  device.lastVerifiedAt = new Date();
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

/**
 * Checks the Device Registry (via cache) to see if the device trust is still valid.
 */
export const validateHardwareTrust = async (
  userId: string,
  deviceToken: string | undefined,
  jwtDeviceId: string,
): Promise<boolean> => {
  // We cache the result to prevent hitting MongoDB on every single request
  return await getOrSetCache<boolean>(
    CACHE_KEYS.DEVICE_TRUST_STATUS(userId, deviceToken || "none"),
    async () => {
      if (!deviceToken) return true;
      const device = await DeviceModel.findOne({ userId, deviceToken });
      // If the device doesn't exist, or it's not the one assigned to this JWT session
      if (!device || device._id.toString() !== jwtDeviceId) {
        return true;
      }
      const trust = await evaluateDeviceTrust(device);

      // Return true if verification is required (not trusted)
      return !trust.trusted;
    },
    600, // 10 minutes cache
  );
};
