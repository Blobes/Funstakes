import { UserSettingsModel } from "@repo/database";
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
    updateOps["display.theme"] = theme;
  }

  if (typeof showSensitiveMedia === "boolean") {
    updateOps["display.showSensitiveMedia"] = showSensitiveMedia;
  }

  if (accessibility) {
    if (typeof accessibility.reduceMotion === "boolean") {
      updateOps["display.accessibility.reduceMotion"] =
        accessibility.reduceMotion;
    }
    if (typeof accessibility.highContrast === "boolean") {
      updateOps["display.accessibility.highContrast"] =
        accessibility.highContrast;
    }
    if (typeof accessibility.fontScale === "number") {
      updateOps["display.accessibility.fontScale"] = accessibility.fontScale;
    }
    if (accessibility.autoPlayMedia) {
      updateOps["display.accessibility.autoPlayMedia"] =
        accessibility.autoPlayMedia;
    }
  }

  if (localization) {
    if (localization.language) {
      updateOps["display.localization.language"] = localization.language;
    }
    if (localization.currency) {
      updateOps["display.localization.currency"] = localization.currency;
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
      "display.theme display.showSensitiveMedia display.accessibility display.localization",
    )
    .lean();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { displayAndApp: updatedSettings?.display },
  };
};
