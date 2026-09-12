import { TopicModel } from "@repo/database";
import crypto from "crypto";
import { TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { getOrSetCache } from "../redis/cache/helpers";

export interface LookupTopicsInput {
  keyword?: string;
  alreadySelected?: string[];
  page?: number;
  limit?: number;
}

export interface LookupTopicsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
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
 *
 * @param input - Operational parameters including keyword, exclusions, page, and limit.
 * @returns Paginated topic search results with metadata.
 */
export const executeTopicsFetch = async (
  input: LookupTopicsInput = {},
): Promise<LookupTopicsResult> => {
  const { keyword, alreadySelected = [], page = 1, limit = 20 } = input;
  const skip = (page - 1) * limit;
  const cleanKeyword = keyword ? keyword.trim() : "";

  const sanitizedExclusions = alreadySelected
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0));

  const exclusionHash = crypto
    .createHash("md5")
    .update([...sanitizedExclusions].sort().join(","))
    .digest("hex");

  const cacheKey = CACHE_KEYS.TOPICS_LOOKUP(
    cleanKeyword,
    exclusionHash,
    page,
    limit,
  );

  const { topics, totalCount } = await getOrSetCache(
    cacheKey,
    async () => {
      const filter: Record<string, any> = {};

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

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const hasNextPage = page < totalPages;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_FETCHED_SUCCESS,
    payload: topics ?? [],
    metaData: {
      totalDocs: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
    },
  };
};
