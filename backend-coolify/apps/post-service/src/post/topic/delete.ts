import { IRemoveTopicOptions } from "@repo/database";
import {
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  pruneDeadTopics,
  removeTopicService,
} from "@repo/shared";
import { Response, NextFunction } from "express";

/**
 * Controller endpoint processing administrative criteria to wipe orphaned or unused taxonomy indices.
 */
export const deleteUnusedTopics = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const serviceResult = await pruneDeadTopics();

    if (serviceResult.status === "SERVER_ERROR") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.deletedCount,
    });
  } catch (error: any) {
    console.error("Taxonomy Prune Processing Instance Failure:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.POST_TOPICS_PRUNED_FALLBACK_ERROR,
      error,
    );
  }
};

/**
 * Administrative controller endpoint to remove or update a specific topic.
 *
 * @param req Authenticated HTTP request containing topic removal parameters.
 * @param res Express HTTP response object.
 * @param next Express next function.
 */
export const deleteTopic = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { currentTitle, topicId, replaceWith } =
    req.body as IRemoveTopicOptions;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    if (!currentTitle) {
      return res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.POST.MISSING_TOPIC_IDENTIFIER,
        payload: null,
      });
    }

    const serviceResult = await removeTopicService({
      topicId,
      currentTitle,
      replaceWith,
    });

    if (serviceResult.status !== "SUCCESS") {
      const statusCode = serviceResult.status === "BAD_REQUEST" ? 400 : 500;
      return res.status(statusCode).json({
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
    console.error("Topic Deletion Controller Execution Error:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.TOPIC_REMOVAL_FALLBACK_ERROR,
      error,
    );
  }
};
