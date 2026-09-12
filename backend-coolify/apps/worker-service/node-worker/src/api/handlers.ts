import { Request, Response } from "express";
import mongoose from "mongoose";
import { TopicModel } from "@repo/database";
import { POST_STRATEGIES } from "../helpers/postStrategies";
import {
  executeTopicsFetch,
  FinalizePostReq,
  INVALIDATE_CACHE,
} from "@repo/shared";
import { FUNSTAKES_REDIS_URL, s3Config } from "@/envVars";

/**
 * Handles incoming transactional write payloads from the Go execution layer.
 */
export const handlePostFinalizer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { postId, postType, userId, caption, media, modResult, event } =
    req.body as FinalizePostReq;

  const strategyKey = `${postType}_${event}`;
  const strategy = POST_STRATEGIES[strategyKey as keyof typeof POST_STRATEGIES];

  if (!strategy) {
    res.status(400).json({
      error: `Unsupported type boundary variant match: ${strategyKey}`,
    });
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const updatedData = await strategy.finalizer(
      {
        postId,
        userId,
        postType,
        caption,
        media,
        modResult,
        event,
        session,
      },
      { s3Config, redisKey: FUNSTAKES_REDIS_URL },
    );

    await session.commitTransaction();

    if (modResult.status === "PUBLISHED") {
      await INVALIDATE_CACHE.forPost({
        userId,
        postType,
        invalidatePostTypeFeed: true,
        invalidateGlobalFirstPage: true,
      });
    }

    res.status(200).json({ success: true, data: updatedData });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error(`Internal engine transaction failure: ${error.message}`);
    res.status(500).json({ error: "State update transaction failed" });
  } finally {
    session.endSession();
  }
};

/**
 * Fetches all registered topic names from MongoDB for the Go moderation worker.
 */
export const handleFetchTopics = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const serviceResult = await executeTopicsFetch({});

    const topicNames = (serviceResult.payload || []).map(
      (t: { title: string }) => t.title,
    );

    res.status(200).json({ success: true, topics: topicNames });
  } catch (error: any) {
    console.error(`Failed to fetch topics for Go worker: ${error.message}`);
    res.status(500).json({ success: false, topics: [] });
  }
};
