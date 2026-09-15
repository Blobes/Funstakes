import { Response, NextFunction } from "express";
import {
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  executeAiTopicsSubmission,
} from "@repo/shared";
import { PostModelType } from "@repo/database";

interface SubmitAiSuggestedTopicsRequest extends IAuthRequest {
  body: {
    topics: string[];
    relatedPostId?: string;
    relatedPostType?: PostModelType;
  };
}

/**
 * Controller endpoint to handle user or system submissions for new AI suggested topics.
 */
export const submitAiSuggestedTopics = async (
  req: SubmitAiSuggestedTopicsRequest,
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
    const { topics, relatedPostId, relatedPostType } = req.body || {};

    await executeAiTopicsSubmission({
      topics,
      relatedPostId,
      relatedPostType,
    });

    return res.status(201).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.POST.AI_TOPICS_SUBMITTED_SUCCESS,
      payload: null,
    });
  } catch (error: any) {
    console.error("Submit AI Suggested Topics Failure:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.AI_TOPICS_SUBMISSION_FAILED,
      error,
    );
  }
};
