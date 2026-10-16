import mongoose from "mongoose";
import { fetchUserSettings } from "../settings";
import { USER_SETTINGS_NESTED_FIELDS } from "@repo/database";

export interface AdditionsResult {
  language?: string | null;
}

export class UserHydrationService {
  /**
   * Hydrates cross-domain user preferences (e.g., settings, localization).
   */
  static async enrichLanguage(
    userId: mongoose.Types.ObjectId | string,
  ): Promise<AdditionsResult> {
    const settingsDoc = await fetchUserSettings({
      userId: userId.toString(),
      select: USER_SETTINGS_NESTED_FIELDS.DISPLAY_LOCALIZATION_LANGUAGE,
    });

    return {
      language: settingsDoc?.display?.localization?.language ?? null,
    };
  }
}
