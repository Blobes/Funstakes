import { UserSettingsModel, USER_SETTINGS_NESTED_FIELDS } from "@repo/database";
import { UserSettingsResult, MESSAGES_REGISTRY } from "@repo/shared";
import { ClientSession } from "mongoose";

export interface NotificationSettingsInput {
  userId: string;
  push?: {
    enabled?: boolean;
    likes?: boolean;
    comments?: boolean;
    mentions?: boolean;
    newFollowers?: boolean;
    directMessages?: boolean;
    systemAnnouncements?: boolean;
  };
  email?: {
    enabled?: boolean;
    digest?: boolean;
    directMessages?: boolean;
    securityAlerts?: boolean;
  };
  quietMode?: {
    isEnabled?: boolean;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
  };
  session?: ClientSession;
}

/**
 * Updates push, email, and quiet mode notification preferences.
 */
export const executeUpdateNotificationSettings = async (
  input: NotificationSettingsInput,
): Promise<UserSettingsResult> => {
  const { userId, push, email, quietMode, session } = input;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  const updateOps: Record<string, unknown> = {};

  if (push) {
    if (typeof push.enabled === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_ENABLED] =
        push.enabled;
    if (typeof push.likes === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_LIKES] =
        push.likes;
    if (typeof push.comments === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_COMMENTS] =
        push.comments;
    if (typeof push.mentions === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_MENTIONS] =
        push.mentions;
    if (typeof push.newFollowers === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_NEW_FOLLOWERS] =
        push.newFollowers;
    if (typeof push.directMessages === "boolean")
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_DIRECT_MESSAGES
      ] = push.directMessages;
    if (typeof push.systemAnnouncements === "boolean")
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_PUSH_SYSTEM_ANNOUNCEMENTS
      ] = push.systemAnnouncements;
  }

  if (email) {
    if (typeof email.enabled === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_EMAIL_ENABLED] =
        email.enabled;
    if (typeof email.digest === "boolean")
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_EMAIL_DIGEST] =
        email.digest;
    if (typeof email.directMessages === "boolean")
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_EMAIL_DIRECT_MESSAGES
      ] = email.directMessages;
    if (typeof email.securityAlerts === "boolean")
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_EMAIL_SECURITY_ALERTS
      ] = email.securityAlerts;
  }

  if (quietMode) {
    if (typeof quietMode.isEnabled === "boolean")
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_QUIET_MODE_IS_ENABLED
      ] = quietMode.isEnabled;
    if (quietMode.startTime)
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_QUIET_MODE_START_TIME
      ] = quietMode.startTime;
    if (quietMode.endTime)
      updateOps[USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_QUIET_MODE_END_TIME] =
        quietMode.endTime;
    if (quietMode.timeZone)
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.NOTIFICATIONS_QUIET_MODE_TIME_ZONE
      ] = quietMode.timeZone;
  }

  if (Object.keys(updateOps).length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.SETTINGS.NO_UPDATE_FIELDS_PROVIDED,
    };
  }

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updateOps },
    { new: true, upsert: true, runValidators: true, session },
  )
    .select("notifications")
    .lean();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { notifications: updatedSettings?.notifications },
  };
};
