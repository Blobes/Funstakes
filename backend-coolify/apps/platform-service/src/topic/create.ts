import { Response, NextFunction } from "express";
import {
  CreateTopicsInput,
  executeTopicsCreation,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";

/**
 * Controller endpoint to handle bulk initialization of missing topics and return topic documents.
 */
export const createNewTopics = async (
  req: IAuthRequest,
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
    const { topics, createdByType } = req.body as CreateTopicsInput;

    const serviceResult = await executeTopicsCreation({
      topics,
      createdById: userId,
      createdByType: createdByType,
    });

    if (serviceResult.status === "INVALID_INPUT") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(201).json({
      status: serviceResult.status,
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Create Missing Topics Failure:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.POST_TOPICS_CREATION_FAILED,
      error,
    );
  }
};
