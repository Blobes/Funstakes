import { Schema, model } from "mongoose";
import { DEVICE_NESTED_FIELDS } from "../../constants/fields";
import { IDeviceDocument, IDeviceUserMeta } from "../../types/others";

const DeviceUserMetaSchema = new Schema<IDeviceUserMeta>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    deviceToken: {
      type: String,
      required: true,
    },

    users: [DeviceUserMetaSchema],

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

    isStale: {
      type: Boolean,
      default: false,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// --- Device Schema Index Configurations ---
// Single field lookups
DeviceSchema.index({ [DEVICE_NESTED_FIELDS.USERS_USER_ID]: 1 });
DeviceSchema.index({ deviceToken: 1 }, { unique: true });
DeviceSchema.index({ isStale: 1 });
DeviceSchema.index({ lastSeenAt: 1 });

// Compound indexes for user-scoped primary checks
DeviceSchema.index({
  [DEVICE_NESTED_FIELDS.USERS_USER_ID]: 1,
  [DEVICE_NESTED_FIELDS.USERS_IS_PRIMARY]: -1,
});

/**
 * Device Model Definition
 */
export const DeviceModel = model<IDeviceDocument>(
  "Device",
  DeviceSchema,
  "devices",
);
