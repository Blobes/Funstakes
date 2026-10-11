import { UserSettingsResult, MESSAGES_REGISTRY } from "@repo/shared";
import { USER_SETTINGS_NESTED_FIELDS, UserSettingsModel } from "@repo/database";

export interface IMutedWordsInput {
  userId: string;
  words: string[];
}

/**
 * Appends unique normalized phrases to the user's content mute list.
 */
export const executeAddMutedWords = async (
  input: IMutedWordsInput,
): Promise<UserSettingsResult> => {
  const { userId, words } = input;

  const normalizedWords = words
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);

  if (normalizedWords.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.SETTINGS.INVALID_MUTED_WORDS_PAYLOAD,
    };
  }

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    {
      $addToSet: {
        [USER_SETTINGS_NESTED_FIELDS.DISPLAY_CONTENT_PREFERENCES_MUTED_WORDS]: {
          $each: normalizedWords,
        },
      },
    },
    { new: true, upsert: true },
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.MUTED_WORDS_UPDATED,
    payload: { settings: updatedSettings },
  };
};

/**
 * Removes target phrases from the user's content mute list.
 */
export const removeMutedWords = async (
  input: IMutedWordsInput,
): Promise<UserSettingsResult> => {
  const { userId, words } = input;

  const normalizedWords = words.map((word) => word.trim().toLowerCase());

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    {
      $pull: {
        [USER_SETTINGS_NESTED_FIELDS.DISPLAY_CONTENT_PREFERENCES_MUTED_WORDS]: {
          $in: normalizedWords,
        },
      },
    },
    { new: true },
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.MUTED_WORDS_UPDATED,
    payload: { settings: updatedSettings! },
  };
};
