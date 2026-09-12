import { IUserPreferredTopic, UserSettingsModel } from "@repo/database";
import { ClientSession } from "mongoose";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { fetchUserSettings } from "../user/settings";
import { UserSettingsResult } from "../../types/general";

export interface UserTopicsParams {
  userId: string;
  topics: IUserPreferredTopic[];
  updateMetadata?: boolean;
  session?: ClientSession;
}

/**
 * Syncs user topic preferences by adding selected topics from the topics database.
 */
export const executeUserTopicsSync = async (
  params: UserTopicsParams,
): Promise<UserSettingsResult> => {
  const { userId, topics, updateMetadata = false, session } = params;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
    };
  }

  const userSettings = await fetchUserSettings({
    userId,
    select: "display.contentPreferences.preferredTopics",
    session,
  });

  const existingPrefIds = new Set(
    (userSettings?.display?.contentPreferences?.preferredTopics || []).map(
      (t: IUserPreferredTopic) => t.topicId.toString(),
    ),
  );

  const toAdd: IUserPreferredTopic[] = [];
  const toUpdateMetadataIds: string[] = [];

  for (const topic of topics) {
    const exists = existingPrefIds.has(topic.topicId.toString());

    if (!exists) {
      toAdd.push(topic);
    }

    if (updateMetadata && exists) {
      toUpdateMetadataIds.push(topic.topicId.toString());
    }
  }

  const bulkOps: Promise<unknown>[] = [];

  // Append new topic preferences to user settings
  if (toAdd.length > 0) {
    bulkOps.push(
      UserSettingsModel.updateOne(
        { userId },
        {
          $push: {
            "display.contentPreferences.preferredTopics": {
              $each: toAdd.map((t) => ({
                topicId: t.topicId,
                title: t.title,
                lastViewed: new Date(),
                addedBy: t.addedBy,
              })),
            },
          },
        },
        { session },
      ),
    );
  }

  // Update lastViewed timestamp for already existing preferred topics
  if (toUpdateMetadataIds.length > 0) {
    bulkOps.push(
      UserSettingsModel.updateOne(
        { userId },
        {
          $set: {
            "display.contentPreferences.preferredTopics.$[elem].lastViewed":
              new Date(),
          },
        },
        {
          arrayFilters: [{ "elem.topicId": { $in: toUpdateMetadataIds } }],
          session,
        },
      ),
    );
  }

  if (bulkOps.length > 0) {
    await Promise.all(bulkOps);
  }

  const updatedSettingsResult = await fetchUserSettings({
    userId,
    select: "display.contentPreferences.preferredTopics",
    session,
  });

  const updatedTopics =
    updatedSettingsResult?.display?.contentPreferences?.preferredTopics || [];

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: updatedTopics,
  };
};

/**
 * Removes targeted topics from a user's preferred topics list.
 */
export const removeTopicsFromUser = async (
  userId: string,
  topicIds: string[],
  session?: ClientSession,
): Promise<UserSettingsResult> => {
  if (!topicIds || !Array.isArray(topicIds)) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPIC_IDS_REQUIRED,
      payload: null,
    };
  }

  if (!topicIds.length) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVED_SUCCESSFULLY,
      payload: null,
    };
  }

  await UserSettingsModel.updateOne(
    { userId },
    {
      $pull: {
        "display.contentPreferences.preferredTopics": {
          topicId: { $in: topicIds },
        },
      },
    },
    { session },
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVED_SUCCESSFULLY,
    payload: null,
  };
};
