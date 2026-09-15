import { Response, NextFunction } from "express";
import {
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  executeAiTopicsResolution,
  ResolveAiTopicParams,
} from "@repo/shared";

interface ResolveAiSuggestedTopicsRequest extends IAuthRequest {
  body: {
    resolutions: ResolveAiTopicParams[];
  };
}

/**
 * Controller endpoint to accept or decline pending AI topic suggestions.
 */
export const resolveAiSuggestedTopics = async (
  req: ResolveAiSuggestedTopicsRequest,
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
    const { resolutions } = req.body || {};

    const serviceResult = await executeAiTopicsResolution(resolutions);

    if (serviceResult.status === "INVALID_INPUT") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: serviceResult.status,
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Resolve AI Suggested Topics Failure:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.AI_TOPICS_RESOLUTION_FAILED,
      error,
    );
  }
};
