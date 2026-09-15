import { TopicModel } from "@repo/database";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { TransInfo } from "../../types/general";
import { INVALIDATE_CACHE } from "../../constants/invalidators";
import { IRemoveTopicOptions, removeTopic } from "@repo/database";

export interface PruneUnusedTopicsResult {
  status: "SUCCESS" | "SERVER_ERROR";
  transInfo: TransInfo;
  deletedCount: number;
}

export interface IRemoveTopicResult {
  status: "BAD_REQUEST" | "SUCCESS" | "SERVER_ERROR";
  transInfo: TransInfo;
  payload: IRemoveTopicOptions | null;
}

/**
 * Scans the database directly to identify and delete topics without remaining active entity bindings.
 */
export const pruneDeadTopics = async (): Promise<PruneUnusedTopicsResult> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = {
      userCount: 0,
      postCount: 0,
      createdAt: { $lt: thirtyDaysAgo },
    };

    // Execute the bulk deletion globally across the collection using the defined conditions
    const result = await TopicModel.deleteMany(query);

    // Invalidate topics lookup cache
    await INVALIDATE_CACHE.forTopics();

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_PRUNED(result.deletedCount),
      deletedCount: result.deletedCount,
    };
  } catch (err: any) {
    console.error(
      "Database execution failure during topic pruning:",
      err.message,
    );

    return {
      status: "SERVER_ERROR",
      transInfo: MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
      deletedCount: 0,
    };
  }
};

/**
 * Service handler for removing or replacing a specific taxonomy topic.
 */
export const removeTopicService = async (
  options: IRemoveTopicOptions,
): Promise<IRemoveTopicResult> => {
  try {
    const { currentTitle, replaceWith } = options;

    if (!currentTitle) {
      return {
        status: "BAD_REQUEST",
        transInfo: MESSAGES_REGISTRY.POST.MISSING_TOPIC_IDENTIFIER,
        payload: null,
      };
    }

    await removeTopic({ currentTitle, replaceWith, session: options?.session });

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.TOPIC_REMOVED_SUCCESS,
      payload: { currentTitle: currentTitle, replaceWith },
    };
  } catch (error: any) {
    console.error("Failed to execute topic removal service:", error);
    return {
      status: "SERVER_ERROR",
      transInfo: MESSAGES_REGISTRY.POST.TOPIC_REMOVAL_FAILED,
      payload: null,
    };
  }
};
