import { Document, Types } from "mongoose";

/**
 * Interface representing the Device document in MongoDB.
 */
export interface IDeviceDocument extends Document {
  userId: Types.ObjectId;
  deviceToken: string;
  name: string | null;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipHash?: string;
  lastCountry?: string;
  isPrimary: boolean;
  isStale: boolean;
  lastSeenAt: Date;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing the trusted device registry entry.
 */
export interface ITrustedDevice {
  deviceId: string;
  isVerified: boolean;
  name: string;
}
