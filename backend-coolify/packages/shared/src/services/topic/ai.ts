import { AnyBulkWriteOperation, ClientSession, Types } from "mongoose";
import {
  AiSuggestedTopicModel,
  IAiSuggestedTopicDocument,
  PostModelType,
  TopicModel,
} from "@repo/database";
import { TransInfo } from "../../types/general";
import { INVALIDATE_CACHE } from "../../constants/invalidators";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { getOrSetCache } from "../redis/cache/helpers";

export interface SubmitAiTopicsParams {
  topics: string[];
  relatedPostId?: string;
  relatedPostType?: PostModelType;
}

export interface ResolveAiTopicParams {
  suggestedTopicId: string;
  action: "ACCEPT" | "DECLINE";
}

export interface ResolveAiTopicResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload?: {
    acceptedTopics: string[];
    declinedTopics: string[];
  } | null;
}

export interface GetAiSuggestedTopicsParams {
  status?: "PENDING" | "ACCEPTED" | "DECLINED";
  relatedPostType?: PostModelType;
  query?: string;
  page?: number;
  limit?: number;
}

export interface GetAiSuggestedTopicsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: {
    topics: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * Fetches AI suggested topics based on status, filter parameters, and pagination with direct Redis caching.
 */
export const executeAiTopicsFetch = async (
  params: GetAiSuggestedTopicsParams = {},
  session?: ClientSession,
): Promise<GetAiSuggestedTopicsResult> => {
  const {
    status = "PENDING",
    relatedPostType = "",
    query,
    page = 1,
    limit = 20,
  } = params;

  const cleanQuery = query ? query.trim().toLowerCase() : "";
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const skip = (safePage - 1) * safeLimit;

  const cacheKey = CACHE_KEYS.AI_SUGGESTED_TOPICS_LOOKUP(
    status,
    relatedPostType,
    cleanQuery,
    safePage,
    safeLimit,
  );

  const { topics, totalCount } = await getOrSetCache(
    cacheKey,
    async () => {
      const filter: Record<string, any> = {};

      if (status) {
        filter.status = status;
      }

      if (relatedPostType) {
        filter.relatedPostType = relatedPostType;
      }

      if (cleanQuery !== "") {
        filter.title = { $regex: cleanQuery, $options: "i" };
      }

      const [data, total] = await Promise.all([
        AiSuggestedTopicModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .lean()
          .session(session || null),
        AiSuggestedTopicModel.countDocuments(filter).session(session || null),
      ]);

      return { topics: data, totalCount: total };
    },
    300,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.AI_TOPICS_FETCHED,
    payload: {
      topics: topics ?? [],
      pagination: {
        total: totalCount,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit) || 1,
      },
    },
  };
};

/**
 * Adds AI-suggested topics to the pending suggestions collection.
 */
export const executeAiTopicsSubmission = async (
  params: SubmitAiTopicsParams,
  session?: ClientSession,
): Promise<void> => {
  const { topics, relatedPostId, relatedPostType = "Gist" } = params;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    console.log("Failed to submit AI suggested topics due to missing topics");
    return;
  }

  const uniqueTitles = [
    ...new Set(topics.map((t) => t.trim().toLowerCase())),
  ].filter((title) => title.length > 0);

  if (uniqueTitles.length === 0) {
    return;
  }

  const parsedPostId = relatedPostId
    ? new Types.ObjectId(relatedPostId)
    : undefined;

  const ops: AnyBulkWriteOperation<IAiSuggestedTopicDocument>[] =
    uniqueTitles.map((title) => ({
      updateOne: {
        filter: { title, status: "PENDING" },
        update: {
          $setOnInsert: {
            title,
            ...(parsedPostId ? { relatedPostId: parsedPostId } : {}),
            relatedPostType,
            status: "PENDING",
          },
        },
        upsert: true,
      },
    }));

  await AiSuggestedTopicModel.bulkWrite(ops, { session });
};

/**
 * Permanently removes suggested topic entries from the database.
 */
export const executeAiTopicsRemoval = async (
  topicIds: string[],
  session?: ClientSession,
): Promise<{ status: string; transInfo: TransInfo }> => {
  await AiSuggestedTopicModel.deleteMany(
    { _id: { $in: topicIds } },
    { session },
  );
  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.AI_TOPICS_REMOVED,
  };
};

/**
 * Resolves AI suggested topics in bulk by approving non-existing topics into the main topics collection or declining them.
 */
export const executeAiTopicsResolution = async (
  resolutions: ResolveAiTopicParams[],
  session?: ClientSession,
): Promise<ResolveAiTopicResult> => {
  if (!resolutions || !Array.isArray(resolutions) || resolutions.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.AI_TOPICS_LIST_REQUIRED,
      payload: {
        acceptedTopics: [],
        declinedTopics: [],
      },
    };
  }

  const resolutionMap = new Map<string, "ACCEPT" | "DECLINE">();
  resolutions.forEach((item) => {
    if (item.suggestedTopicId) {
      resolutionMap.set(item.suggestedTopicId.toString(), item.action);
    }
  });

  const topicIds = Array.from(resolutionMap.keys());
  const suggestions = await AiSuggestedTopicModel.find({
    _id: { $in: topicIds },
  }).session(session || null);

  if (suggestions.length === 0) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.AI_TOPICS_NOT_FOUND,
      payload: {
        acceptedTopics: [],
        declinedTopics: [],
      },
    };
  }

  const rawAcceptedTitlesSet = new Set<string>();
  const declinedTitlesSet = new Set<string>();
  const acceptedSuggestionIds: string[] = [];
  const declinedSuggestionIds: string[] = [];

  for (const suggestion of suggestions) {
    const action = resolutionMap.get(suggestion._id.toString());
    const normalizedTitle = suggestion.title.trim().toLowerCase();

    if (action === "ACCEPT") {
      rawAcceptedTitlesSet.add(normalizedTitle);
      acceptedSuggestionIds.push(suggestion._id.toString());
    } else if (action === "DECLINE") {
      declinedTitlesSet.add(normalizedTitle);
      declinedSuggestionIds.push(suggestion._id.toString());
    }
  }

  const pendingAcceptedTitles = Array.from(rawAcceptedTitlesSet);

  let existingTopicsInDb: string[] = [];
  if (pendingAcceptedTitles.length > 0) {
    const existingTopicDocs = await TopicModel.find({
      title: { $in: pendingAcceptedTitles },
    })
      .select("title")
      .lean()
      .session(session || null);

    existingTopicsInDb = existingTopicDocs.map((doc) =>
      doc.title.toLowerCase(),
    );
  }

  const existingTopicsSet = new Set(existingTopicsInDb);
  const brandNewAcceptedTitles = pendingAcceptedTitles.filter(
    (title) => !existingTopicsSet.has(title),
  );

  const mainTopicOps = brandNewAcceptedTitles.map((title) => ({
    updateOne: {
      filter: { title },
      update: {
        $setOnInsert: {
          title,
          userCount: 0,
          postCount: 0,
        },
      },
      upsert: true,
    },
  }));

  const suggestionOps: any[] = [];

  if (acceptedSuggestionIds.length > 0) {
    suggestionOps.push({
      updateMany: {
        filter: { _id: { $in: acceptedSuggestionIds } },
        update: { $set: { status: "ACCEPTED" } },
      },
    });
  }

  if (declinedSuggestionIds.length > 0) {
    suggestionOps.push({
      updateMany: {
        filter: { _id: { $in: declinedSuggestionIds } },
        update: { $set: { status: "DECLINED" } },
      },
    });
  }

  if (mainTopicOps.length > 0) {
    await TopicModel.bulkWrite(mainTopicOps, { session });
    await INVALIDATE_CACHE.forTopics();
  }

  if (suggestionOps.length > 0) {
    await AiSuggestedTopicModel.bulkWrite(suggestionOps, { session });
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.AI_TOPICS_RESOLVED,
    payload: {
      acceptedTopics: brandNewAcceptedTitles,
      declinedTopics: Array.from(declinedTitlesSet),
    },
  };
};
