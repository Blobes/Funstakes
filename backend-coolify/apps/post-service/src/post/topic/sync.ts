import { Response, NextFunction } from "express";
import {
  executePostTopicsSync,
  forwardError,
  IAuthRequest,
  ManageTopicsParams,
  MESSAGES_REGISTRY,
} from "@repo/shared";

/**
 * Controller endpoint processing ingestion configurations to match up taxonomy tags safely against target updates.
 */
export const syncPostTopics = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { topics, targetId, targetModel, eventType, addedBy } =
    req.body as ManageTopicsParams;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executePostTopicsSync({
      topics,
      userId,
      targetId,
      targetModel,
      eventType,
      addedBy,
    });

    if (serviceResult.status === "INVALID_INPUT") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error(
      `[Topic Manager] Execution Instance Failure during ${eventType}:`,
      error,
    );

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.POST_TOPICS_UPDATE_FALLBACK_ERROR,
      error,
    );
  }
};
