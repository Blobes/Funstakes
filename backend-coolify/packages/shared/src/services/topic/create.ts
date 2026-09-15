import { AnyBulkWriteOperation, ClientSession, Types } from "mongoose";
import { ITopicDocument, TopicModel, TopicSourceType } from "@repo/database";
import { TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { INVALIDATE_CACHE } from "../../constants/invalidators";

export interface CreateTopicsParams {
  topics: string[];
  createdById?: string;
  createdByType?: TopicSourceType;
}

export interface CreateTopicsResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: ITopicDocument[];
}

/**
 * Creates missing topics in bulk and returns the complete set of topic documents.
 */
export const executeTopicsCreation = async (
  params: CreateTopicsParams,
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

  const uniqueTitles = [
    ...new Set(topics.map((t) => t.trim().toLowerCase())),
  ].filter((title) => title.length > 0);

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

  const topicOps: AnyBulkWriteOperation<ITopicDocument>[] = uniqueTitles.map(
    (title) => ({
      updateOne: {
        filter: { title },
        update: {
          $setOnInsert: {
            title,
            userCount: 0,
            postCount: 0,
            createdById: parsedCreatedById,
            createdByType: createdByType,
          },
        },
        upsert: true,
      },
    }),
  );

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
