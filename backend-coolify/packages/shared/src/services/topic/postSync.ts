import mongoose, { ClientSession } from "mongoose";
import {
  ITopicDocument,
  TopicModel,
  UserSettingsModel,
  TopicSourceType,
} from "@repo/database";
import { TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { INVALIDATE_CACHE } from "../../constants/invalidators";

export type TopicUpdateEvent = "POST_CREATION_OR_UPDATE" | "POST_ENGAGEMENT";

export interface ManageTopicsParams {
  topics: string[];
  userId?: string;
  targetId?: string;
  targetModel?: "Gist" | "Stake";
  eventType: TopicUpdateEvent;
  // addedBy?: TopicAddedBy;
}

export interface ManageTopicsResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: ITopicDocument[];
}

/**
 * Attaches topic IDs to a post target and increments post usage counters.
 */
export const syncOnPostCreationOrUpdate = async (
  targetId: string,
  targetModel: string,
  topicDocs: ITopicDocument[],
  session?: ClientSession,
): Promise<void> => {
  const DynamicModel = mongoose.model(targetModel);

  const postData = await DynamicModel.findById(targetId)
    .session(session || null)
    .select("topics");

  if (!postData) {
    throw new Error(
      MESSAGES_REGISTRY.SYSTEM.TARGET_MODEL_NOT_FOUND(targetModel).message,
    );
  }

  const existingPostTopicIds = (postData.topics || []).map((id: any) =>
    id.toString(),
  );
  const newTopicIds = topicDocs
    .filter((t) => !existingPostTopicIds.includes(t._id.toString()))
    .map((t) => t._id);

  if (newTopicIds.length > 0) {
    await Promise.all([
      DynamicModel.updateOne(
        { _id: targetId },
        { $push: { topics: { $each: newTopicIds } } },
        { session },
      ),
      TopicModel.updateMany(
        { _id: { $in: newTopicIds } },
        { $inc: { postCount: 1 } },
        { session },
      ),
    ]);
    await INVALIDATE_CACHE.forTopics();
  }
};

/**
 * Appends interacted topics to user settings display content preferences.
 */
export const syncWithUserViaPostEngagement = async (
  userId: string,
  topicDocs: ITopicDocument[],
  session?: ClientSession,
): Promise<void> => {
  const preferenceTopics = topicDocs.map((t) => ({
    topicId: t._id,
    title: t.title,
    addedBy: "SYSTEM" as const,
    lastViewed: new Date(),
  }));

  await UserSettingsModel.updateOne(
    { userId },
    {
      $addToSet: {
        "display.contentPreferences.preferredTopics": {
          $each: preferenceTopics,
        },
      },
    },
    { session, upsert: true },
  );
};

/**
 * Validates existing topics against the database and dispatches sync events.
 */
export const executePostTopicsSync = async (
  params: ManageTopicsParams,
  session?: ClientSession,
): Promise<ManageTopicsResult> => {
  const {
    topics,
    userId,
    targetId,
    targetModel,
    eventType: actionType,
  } = params;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
      payload: [],
    };
  }

  const uniqueTitles = [...new Set(topics.map((t) => t.trim().toLowerCase()))];

  const topicDocs: ITopicDocument[] = await TopicModel.find({
    title: { $in: uniqueTitles },
  })
    .session(session || null)
    .lean();

  if (topicDocs.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
      payload: [],
    };
  }

  switch (actionType) {
    case "POST_CREATION_OR_UPDATE":
      if (!targetId || !targetModel) {
        return {
          status: "INVALID_INPUT",
          transInfo: MESSAGES_REGISTRY.POST.MISSING_POST_PROCESSING_PARAMS,
          payload: [],
        };
      }
      await syncOnPostCreationOrUpdate(
        targetId,
        targetModel,
        topicDocs,
        session,
      );
      break;

    case "POST_ENGAGEMENT":
      if (userId) {
        await syncWithUserViaPostEngagement(userId, topicDocs, session);
      }
      break;

    default:
      return {
        status: "INVALID_INPUT",
        transInfo: MESSAGES_REGISTRY.SYSTEM.INVALID_OPERATIONAL_ROUTING,
        payload: [],
      };
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_PROCESSED_SUCCESSFULLY,
    payload: topicDocs,
  };
};
