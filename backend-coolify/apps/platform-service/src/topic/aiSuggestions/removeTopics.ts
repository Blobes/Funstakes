import { Response, NextFunction } from "express";
import {
  executeAiTopicsRemoval,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface RemoveAiSuggestedTopicsRequest extends IAuthRequest {
  body: {
    topicIds: string[];
  };
}

/**
 * Controller endpoint to permanently remove AI suggested topics by IDs.
 */
export const removeAiSuggestedTopics = async (
  req: RemoveAiSuggestedTopicsRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const { topicIds } = req.body || {};

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.POST.AI_TOPICS_LIST_REQUIRED,
        payload: null,
      });
    }

    const serviceResult = await executeAiTopicsRemoval(topicIds);

    return res.status(200).json({
      status: serviceResult.status,
      ...serviceResult.transInfo,
      payload: null,
    });
  } catch (error: any) {
    console.error("Remove AI Suggested Topics Failure:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.AI_TOPICS_REMOVAL_FAILED,
      error,
    );
  }
};
