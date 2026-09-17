import { Schema, model } from "mongoose";
import { IDeviceDocument } from "../../types/device";

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deviceToken: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: null,
    },

    deviceType: String,
    os: String,
    browser: String,

    userAgent: String,
    ipHash: String,
    lastCountry: String,

    isPrimary: {
      type: Boolean,
      default: false,
    },

    isStale: {
      type: Boolean,
      default: false,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// --- Device Schema Index Configurations ---
// Single field lookups
DeviceSchema.index({ userId: 1 });
DeviceSchema.index({ deviceToken: 1 });
DeviceSchema.index({ isStale: 1 });
DeviceSchema.index({ lastSeenAt: 1 });

// Optimized for session lookup & primary device retrieval
DeviceSchema.index({ userId: 1, isPrimary: -1, isStale: 1 });
DeviceSchema.index({ isPrimary: 1, lastSeenAt: 1 });
// Fast lookup for stale device purging jobs
DeviceSchema.index({ isStale: 1, lastSeenAt: 1 });
// Deduplication and single device queries by token
DeviceSchema.index({ deviceToken: 1, userId: 1 });
// Deduplication for user device tracking by IP fingerprinting
DeviceSchema.index({ userId: 1, ipHash: 1 });

/**
 * Device Model Definition
 */
export const DeviceModel = model<IDeviceDocument>(
  "Device",
  DeviceSchema,
  "devices",
);
