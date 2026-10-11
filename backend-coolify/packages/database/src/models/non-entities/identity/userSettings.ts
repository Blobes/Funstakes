import { Model, Schema, model } from "mongoose";
import {
  IUserPreferredTopic,
  IUserSettingsDocument,
} from "../../../types/others";
import { USER_SETTINGS_NESTED_FIELDS } from "../../../constants/fields";

/**
 * Schema defining topic preference tracking subdocument.
 */
const PreferredTopicSchema = new Schema<IUserPreferredTopic>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: String,
      enum: ["USER", "SYSTEM", "ADMIN"],
      default: "SYSTEM",
    },
    lastViewed: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

/**
 * Model schema for persistent global user settings.
 */
const UserSettingsSchema = new Schema<IUserSettingsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    privacy: {
      isPrivateAccount: { type: Boolean, default: false },
      discoverability: {
        searchIndexing: { type: Boolean, default: true },
        contactSync: { type: Boolean, default: true },
        recommendToOthers: { type: Boolean, default: true },
      },
      directMessaging: {
        type: String,
        enum: ["EVERYONE", "FOLLOWERS", "NO_ONE"],
        default: "EVERYONE",
      },
      mentionsAndTagging: {
        type: String,
        enum: ["EVERYONE", "FOLLOWERS", "NO_ONE"],
        default: "EVERYONE",
      },
    },
    notifications: {
      push: {
        enabled: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        newFollowers: { type: Boolean, default: true },
        directMessages: { type: Boolean, default: true },
        systemAnnouncements: { type: Boolean, default: true },
      },
      email: {
        enabled: { type: Boolean, default: true },
        digest: { type: Boolean, default: false },
        directMessages: { type: Boolean, default: true },
        securityAlerts: { type: Boolean, default: true },
      },
      quietMode: {
        isEnabled: { type: Boolean, default: false },
        startTime: { type: String, default: "22:00" },
        endTime: { type: String, default: "07:00" },
        timeZone: { type: String, default: "UTC" },
      },
    },
    display: {
      theme: {
        type: String,
        enum: ["SYSTEM", "LIGHT", "DARK"],
        default: "SYSTEM",
      },
      showSensitiveMedia: { type: Boolean, default: false },
      accessibility: {
        reduceMotion: { type: Boolean, default: false },
        highContrast: { type: Boolean, default: false },
        fontScale: { type: Number, default: 1.0 },
        autoPlayMedia: {
          type: String,
          enum: ["ALWAYS", "WIFI_ONLY", "NEVER"],
          default: "ALWAYS",
        },
      },
      localization: {
        language: { type: String, default: "en" },
        currency: { type: String, default: "USD" },
      },
      contentPreferences: {
        preferredTopics: {
          type: [PreferredTopicSchema],
          default: [],
        },
        mutedWords: {
          type: [String],
          default: [],
        },
      },
    },
  },
  { timestamps: true },
);

// User Settings Schema Indexes
UserSettingsSchema.index({ userId: 1 }, { unique: true });
UserSettingsSchema.index(
  {
    [USER_SETTINGS_NESTED_FIELDS.PRIVACY_DISCOVERABILITY_RECOMMEND_TO_OTHERS]: 1,
  },
  {
    partialFilterExpression: {
      [USER_SETTINGS_NESTED_FIELDS.PRIVACY_DISCOVERABILITY_RECOMMEND_TO_OTHERS]: true,
    },
  },
);

UserSettingsSchema.index(
  { [USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_QUIET_MODE_IS_ENABLED]: 1 },
  {
    partialFilterExpression: {
      [USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_QUIET_MODE_IS_ENABLED]: true,
    },
  },
);

export const UserSettingsModel: Model<IUserSettingsDocument> =
  model<IUserSettingsDocument>(
    "UserSettings",
    UserSettingsSchema,
    "user_settings",
  );
