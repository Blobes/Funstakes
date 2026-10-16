import { ITopicDocument, TopicCategory, TopicModel } from "@repo/database";
import crypto from "crypto";
import { ITopic, TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { getOrSetCache } from "../redis/cache/helpers";

export interface LookupTopicsInput {
  topic?: ITopic;
  alreadySelected?: string[];
  page?: number;
  limit?: number;
  fetchAll?: boolean;
}

export interface LookupTopicsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: { topicDocs: ITopicDocument[]; categories?: TopicCategory[] };
  metaData: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Executes paginated calculations across cache lookups and indexed database queries to evaluate matches for topic categories.
 * @param input - Operational parameters including keyword, exclusions, page, and limit.
 * @returns Paginated topic search results with metadata.
 */
export const executeTopicsFetch = async (
  input: LookupTopicsInput = {},
): Promise<LookupTopicsResult> => {
  const {
    topic,
    alreadySelected = [],
    page = 1,
    limit = 20,
    fetchAll = false,
  } = input;
  const skip = (page - 1) * limit;
  const cleanKeyword = topic?.keyword ? topic.keyword.trim() : "";
  const cleanCategory = topic?.category ? topic.category.trim() : "";

  const sanitizedExclusions = alreadySelected
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0));

  const exclusionHash = crypto
    .createHash("md5")
    .update([...sanitizedExclusions].sort().join(","))
    .digest("hex");

  const cacheKey = CACHE_KEYS.TOPICS_LOOKUP({
    keyword: cleanKeyword,
    category: cleanCategory,
    excludedHash: exclusionHash,
    page,
    limit,
    fetchAll,
  });

  const { topics, totalCount, categories } = await getOrSetCache(
    cacheKey,
    async () => {
      const filter: Record<string, any> = {};

      if (cleanCategory !== "") {
        filter.category = cleanCategory;
      }

      if (sanitizedExclusions.length > 0) {
        filter.title = { $nin: sanitizedExclusions };
      }

      if (cleanKeyword !== "") {
        filter.title = {
          ...filter.title,
          $regex: cleanKeyword,
          $options: "i",
        };
      }

      if (fetchAll) {
        const [data, distinctCategories] = await Promise.all([
          TopicModel.find(filter).lean(),
          TopicModel.distinct("category", filter),
        ]);
        const validCategories = distinctCategories.filter(
          (c): c is TopicCategory => Boolean(c),
        );
        return {
          topics: data,
          totalCount: data.length,
          categories: validCategories,
        };
      }

      const total = await TopicModel.countDocuments(filter);
      let databaseQuery = TopicModel.find(filter);

      if (cleanKeyword !== "") {
        databaseQuery = databaseQuery.sort({ postCount: -1 });
      } else {
        databaseQuery = databaseQuery.sort({ postCount: -1, createdAt: -1 });
      }

      const data = await databaseQuery.skip(skip).limit(limit);
      return { topics: data, totalCount: total };
    },
    300,
  );

  const totalPages = fetchAll ? 1 : Math.ceil(totalCount / limit) || 1;
  const hasNextPage = fetchAll ? false : page < totalPages;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_FETCHED_SUCCESS,
    payload: { topicDocs: topics ?? [], categories },
    metaData: {
      totalDocs: totalCount,
      totalPages,
      currentPage: page,
      limit: fetchAll ? totalCount : limit,
      hasNextPage,
    },
  };
};
