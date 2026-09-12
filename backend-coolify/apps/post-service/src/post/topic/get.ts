import { Response, NextFunction } from "express";
import {
  executeTopicsFetch,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface LookupRequest extends IAuthRequest {
  body: {
    keyword?: string;
    alreadySelected?: string[];
  };
  query: {
    page?: string;
    limit?: string;
  };
}

/**
 * Controller endpoint to manage request parameters and route responses for taxonomy lookups.
 */
export const getTopics = async (
  req: LookupRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { keyword, alreadySelected } = req.body || {};
  const userId = req.user?.id;
  const page = parseInt(req.query?.page as string, 10) || 1;
  const limit = parseInt(req.query?.limit as string, 10) || 20;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeTopicsFetch({
      keyword,
      alreadySelected,
      page,
      limit,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      metaData: serviceResult.metaData,
    });
  } catch (error: any) {
    console.error("Taxonomy Lookup Failure Instance:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.POST_TOPIC_LOOKUP_FAILED,
      error,
    );
  }
};
