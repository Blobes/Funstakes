import { Response, NextFunction } from "express";
import {
  getClientIp,
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  generateRandomIp,
  buildLocationFromRequest,
} from "@repo/shared";
import { IMedia } from "@repo/database";
import { FUNSTAKES_REDIS_URL, s3Config } from "@/envVars";
import { executeCreateGist } from "../services/createGist";

export interface CreateRequest extends IAuthRequest {
  body: {
    caption?: string;
    media?: IMedia[];
    topics?: string[];
    hasSensitiveGraphic?: boolean;
    skipModeration?: boolean;
  };
}

/**
 * Controller endpoint to handle request routing parameters for fresh content record initialization.
 */
export const createGist = async (
  req: CreateRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { caption, media, topics, skipModeration, hasSensitiveGraphic } =
    req.body;

  const location = await buildLocationFromRequest(req);

  try {
    const serviceResult = await executeCreateGist({
      userId,
      caption,
      media,
      topics,
      skipModeration,
      hasSensitiveGraphic,
      s3Config,
      redisUrl: FUNSTAKES_REDIS_URL,
      location,
    });

    if (serviceResult.status === "INVALID_SESSION") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "MISSING_CONTENT") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    if (serviceResult.status === "SUCCESS_BYPASS") {
      return res.status(201).json({
        status: "SUCCESS",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(202).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("[createGist] Error:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.POST.CREATION_FALLBACK_ERROR(),
      error,
    );
  }
};
