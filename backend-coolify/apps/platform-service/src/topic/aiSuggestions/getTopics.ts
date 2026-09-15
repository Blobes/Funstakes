import { Response, NextFunction } from "express";
import {
  forwardError,
  executeAiTopicsFetch,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { PostModelType } from "@repo/database";

interface GetAiSuggestedTopicsRequest extends IAuthRequest {
  query: {
    status?: "PENDING" | "ACCEPTED" | "DECLINED";
    relatedPostType?: PostModelType;
    query?: string;
    page?: string;
    limit?: string;
  };
}

/**
 * Controller endpoint to handle fetching AI suggested topics using query filters.
 */
export const getAiSuggestedTopics = async (
  req: GetAiSuggestedTopicsRequest,
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
    const status = req.query.status;
    const relatedPostType = req.query.relatedPostType;
    const query = req.query.query;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const serviceResult = await executeAiTopicsFetch({
      status,
      relatedPostType,
      query,
      page,
      limit,
    });

    return res.status(200).json({
      status: serviceResult.status,
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Fetch AI Suggested Topics Failure:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.AI_TOPICS_FETCH_FAILED,
      error,
    );
  }
};
