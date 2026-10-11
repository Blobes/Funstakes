/\*\*

- Resolves IP address into standard GeoJSON Point location structure.
- @param ipAddress Target client IP address.
- @returns Formatted GeoJSON point location object or undefined.
  \*/
  export const buildLocationFromIp = async (
  ipAddress: string,
  ): Promise<ILocation | undefined> => {
  const geoData = await getLocationFromIp(ipAddress);
  if (!geoData) return undefined;

return {
name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
city: geoData.city,
state: geoData.state,
country: geoData.country,
region: geoData.regionCode,
continent: geoData.continent,
type: "Point" as const,
coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
};
};

import { DeviceModel, IDeviceDocument, IUserDocument } from "@repo/database";
import { UAParser } from "ua-parser-js";
import mongoose, { Types } from "mongoose";
import { cleanDeviceSessions } from "./session";
import { CACHE_EXPIRY, CACHE_KEYS } from "../constants/cacheKeys";
import { deleteCache, getOrSetCache } from "./redis/cache/helpers";

const TRUST*WINDOW = 30 * 24 _ 60 _ 60 \_ 1000; // 30 days

export interface DeviceUsertOptions {
user: IUserDocument;
targetDeviceId?: string;
deviceToken?: string;
userAgent?: string;
session?: mongoose.ClientSession;
markAsVerified?: boolean;
}

/\*\*

- Registers or updates a device record shared by user accounts and ensures a primary anchor exists.
  \*/
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
\_id: targetDeviceId,
users: user.\_id,
}).session(session ?? null);
}

// 2. Fall back to resolving by deviceToken across all registered users
if (!device && deviceToken) {
device = await DeviceModel.findOne({
deviceToken,
}).session(session ?? null);
}

const parser = new UAParser(userAgent);
const ua = parser.getResult();

if (!device) {
const [newDevice] = await DeviceModel.create(
[
{
users: [user._id],
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
} else {
// Append user ID if the existing device record isn't linked yet
const hasUser = device.users.some((id) => id.equals(user.\_id));
if (!hasUser) {
device.users.push(user.\_id as Types.ObjectId);
}
}

device.lastSeenAt = new Date();

if (markAsVerified) {
device.isVerified = true;
}

await device.save({ session });

await ensurePrimaryDevice(user, device.\_id, session);

return device;
}

/\*\*

- Anchors the user's account to a primary device and revokes sessions on all demoted hardware.
  \*/
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
\_id: currentDeviceId,
users: user.\_id,
}).session(session ?? null);
}

// Fallback to the most recent hardware in the registry linked to the user.
if (!primaryCandidate) {
primaryCandidate = await DeviceModel.findOne({ users: user.\_id })
.sort({ lastSeenAt: -1 })
.session(session ?? null);
}

if (primaryCandidate) {
const candidateIdStr = primaryCandidate.\_id.toString();

    // 1. Find all other devices currently marked as primary for this user (the demotion list).
    const demotedDevices = await DeviceModel.find({
      users: user._id,
      isPrimary: true,
      _id: { $ne: primaryCandidate._id },
    })
      .select("_id")
      .session(session ?? null);

    const idsToClear = demotedDevices.map((d) => d._id.toString());

    // 2. Revoke all sessions for the old primaries and the new candidate.
    await cleanDeviceSessions(user._id.toString(), [
      ...idsToClear,
      candidateIdStr,
    ]);

    // 3. Database batch update: Ensure only the candidate is primary for this user.
    await DeviceModel.updateMany(
      {
        users: user._id,
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

/\*\*

- Checks the Device Registry (via cache) to see if the device trust is still valid.
  \*/
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
        users: userId,
      });

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
    CACHE_EXPIRY.MIN_5,

);
};

// export const checkEmailReputation = async (email: string): Promise<boolean> => {
// if (!email || !email.includes("@")) return false;

// const domain = email.split("@")[1];
// const freeProviders = [
// "gmail.com",
// "yahoo.com",
// "outlook.com",
// "hotmail.com",
// "icloud.com",
// "proton.me",
// "protonmail.com",
// "aol.com",
// "mail.com",
// "yandex.com",
// "gmx.com",
// ];

// if (freeProviders.includes(domain.toLowerCase())) {
// return false;
// }

// try {
// const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;
// if (!apiKey) {
// console.warn(
// "ABSTRACT_EMAIL_API_KEY is not set — skipping email reputation check.",
// );
// return false;
// }

// const response = await fetch(
// `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(
//         email,
//       )}`,
// );
// if (!response.ok) {
// throw new Error(`HTTP error! status: ${response.status}`);
// }

// type AbstractEmailResponse = {
// is_free_email?: boolean;
// deliverability?: "DELIVERABLE" | "UNDELIVERABLE" | "UNKNOWN";
// is_disposable_email?: boolean;
// };

// const data = (await response.json()) as AbstractEmailResponse;
// return (
// data.is_free_email === false &&
// data.is_disposable_email === false &&
// data.deliverability === "DELIVERABLE"
// );
// } catch (err) {
// console.error("Email Reputation API Error:", err);
// return false;
// }
// };
