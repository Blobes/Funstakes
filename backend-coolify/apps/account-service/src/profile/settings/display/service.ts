import { UserSettingsModel, USER_SETTINGS_NESTED_FIELDS } from "@repo/database";
import { UserSettingsResult, MESSAGES_REGISTRY } from "@repo/shared";
import { ClientSession } from "mongoose";

export interface DisplaySettingsInput {
  userId: string;
  theme?: "SYSTEM" | "LIGHT" | "DARK";
  showSensitiveMedia?: boolean;
  accessibility?: {
    reduceMotion?: boolean;
    highContrast?: boolean;
    fontScale?: number;
    autoPlayMedia?: "ALWAYS" | "WIFI_ONLY" | "NEVER";
  };
  localization?: {
    language?: string;
    currency?: string;
  };
  session?: ClientSession;
}

/**
 * Updates UI, accessibility, and localization display options.
 */
export const executeDisplaySettingsUpdate = async (
  input: DisplaySettingsInput,
): Promise<UserSettingsResult> => {
  const {
    userId,
    theme,
    showSensitiveMedia,
    accessibility,
    localization,
    session,
  } = input;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  const updateOps: Record<string, unknown> = {};

  if (theme) {
    updateOps[USER_SETTINGS_NESTED_FIELDS.DISPLAY_THEME] = theme;
  }

  if (typeof showSensitiveMedia === "boolean") {
    updateOps[USER_SETTINGS_NESTED_FIELDS.DISPLAY_SHOW_SENSITIVE_MEDIA] =
      showSensitiveMedia;
  }

  if (accessibility) {
    if (typeof accessibility.reduceMotion === "boolean") {
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.DISPLAY_ACCESSIBILITY_REDUCE_MOTION
      ] = accessibility.reduceMotion;
    }
    if (typeof accessibility.highContrast === "boolean") {
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.DISPLAY_ACCESSIBILITY_HIGH_CONTRAST
      ] = accessibility.highContrast;
    }
    if (typeof accessibility.fontScale === "number") {
      updateOps[USER_SETTINGS_NESTED_FIELDS.DISPLAY_ACCESSIBILITY_FONT_SCALE] =
        accessibility.fontScale;
    }
    if (accessibility.autoPlayMedia) {
      updateOps[
        USER_SETTINGS_NESTED_FIELDS.DISPLAY_ACCESSIBILITY_AUTO_PLAY_MEDIA
      ] = accessibility.autoPlayMedia;
    }
  }

  if (localization) {
    if (localization.language) {
      updateOps[USER_SETTINGS_NESTED_FIELDS.DISPLAY_LOCALIZATION_LANGUAGE] =
        localization.language;
    }
    if (localization.currency) {
      updateOps[USER_SETTINGS_NESTED_FIELDS.DISPLAY_LOCALIZATION_CURRENCY] =
        localization.currency;
    }
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
    .select(
      `${USER_SETTINGS_NESTED_FIELDS.DISPLAY_THEME} ${USER_SETTINGS_NESTED_FIELDS.DISPLAY_SHOW_SENSITIVE_MEDIA} ${USER_SETTINGS_NESTED_FIELDS.DISPLAY_ACCESSIBILITY} ${USER_SETTINGS_NESTED_FIELDS.DISPLAY_LOCALIZATION}`,
    )
    .lean();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { displayAndApp: updatedSettings?.display },
  };
};
