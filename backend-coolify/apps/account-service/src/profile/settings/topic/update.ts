import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  UserTopicsParams,
  executeUserTopicsSync,
  forwardError,
} from "@repo/shared";

/**
 * Controller endpoint to add or remove preferred topics from user preferences.
 */
export const syncUserTopics = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  const { topics, updateMetadata } = req.body as UserTopicsParams;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await executeUserTopicsSync({
      userId,
      topics,
      updateMetadata,
    });

    if (serviceResult.status === "NOT_FOUND") {
      res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
    return;
  } catch (error: any) {
    console.error("[toggleUserTopicPreference] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.SETTINGS.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
