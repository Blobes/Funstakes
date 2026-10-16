import { AnyBulkWriteOperation, ClientSession, Types } from "mongoose";
import {
  ITopicDocument,
  TopicModel,
  ResourceType,
  TopicCategory,
} from "@repo/database";
import { ITopic, TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { INVALIDATE_CACHE } from "../../constants/invalidators";

export interface CreateTopicsInput {
  topics: ITopic[];
  createdById?: string;
  createdByType?: ResourceType;
}

export interface CreateTopicsResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: ITopicDocument[];
}

/**
 * Creates missing topics in bulk with assigned categories and returns topic documents.
 */
export const executeTopicsCreation = async (
  params: CreateTopicsInput,
  session?: ClientSession,
): Promise<CreateTopicsResult> => {
  const { topics, createdById, createdByType = "SYSTEM" } = params;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
      payload: [],
    };
  }

  // Deduplicate incoming topics by title while preserving category mapping
  const uniqueTopicsMap = new Map<string, TopicCategory>();
  topics.forEach((t) => {
    const trimmedTitle = t.keyword.trim();
    if (trimmedTitle.length > 0) {
      const lowerTitle = trimmedTitle.toLowerCase();
      if (!uniqueTopicsMap.has(lowerTitle)) {
        uniqueTopicsMap.set(lowerTitle, t.category);
      }
    }
  });

  const uniqueTitles = Array.from(uniqueTopicsMap.keys());

  if (uniqueTitles.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
      payload: [],
    };
  }

  const parsedCreatedById = createdById
    ? new Types.ObjectId(createdById)
    : null;

  const topicOps: AnyBulkWriteOperation<ITopicDocument>[] = Array.from(
    uniqueTopicsMap.entries(),
  ).map(([title, category]) => ({
    updateOne: {
      filter: { title },
      update: {
        $setOnInsert: {
          title,
          category,
          userCount: 0,
          postCount: 0,
          createdById: parsedCreatedById,
          createdByType,
        },
        $set: {
          category,
        },
      },
      upsert: true,
    },
  }));

  await TopicModel.bulkWrite(topicOps, { session });
  await INVALIDATE_CACHE.forTopics();

  const topicDocs: ITopicDocument[] = await TopicModel.find({
    title: { $in: uniqueTitles },
  })
    .session(session || null)
    .lean();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_PROCESSED_SUCCESSFULLY,
    payload: topicDocs,
  };
};
