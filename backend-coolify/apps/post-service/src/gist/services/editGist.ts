import mongoose from "mongoose";
import { GistModel } from "@repo/database";
import {
  IPostModData,
  enqueueModerationTask,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

export interface EditGistInput {
  userId?: string;
  gistId: string;
  caption: string;
  redisUrl: string;
}

export interface EditGistResult {
  status:
    | "CONTENT_REQUIRED"
    | "INVALID_SESSION"
    | "NOT_FOUND"
    | "PERMISSION_DENIED"
    | "LIMIT_REACHED"
    | "SUCCESS_UNDER_REVIEW";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Executes business logic orchestration layers to modify an existing text gist, verifying ownership boundaries and dispatching asynchronous payload pipelines.
 */
export const executeEditGist = async (
  input: EditGistInput,
): Promise<EditGistResult> => {
  const { userId, gistId, caption, redisUrl } = input;

  if (!caption?.trim()) {
    return {
      status: "CONTENT_REQUIRED",
      transInfo: MESSAGES_REGISTRY.POST.POST_MUST_CONTAIN_TEXT_OR_MEDIA("Gist"),
      payload: null,
    };
  }

  if (!mongoose.Types.ObjectId.isValid(gistId) || !userId) {
    return {
      status: "INVALID_SESSION",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_POST_ID_OR_SESSION("Gist"),
      payload: null,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const gist = await GistModel.findById(gistId).session(session);

    if (!gist) {
      await session.abortTransaction();
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.POST.POST_NOT_FOUND("Gist"),
        payload: null,
      };
    }

    if (gist.authorId.toString() !== userId) {
      await session.abortTransaction();
      return {
        status: "PERMISSION_DENIED",
        transInfo: MESSAGES_REGISTRY.POST.PERMISSION_DENIED,
        payload: null,
      };
    }

    if (gist.editCount >= 3) {
      await session.abortTransaction();
      return {
        status: "LIMIT_REACHED",
        transInfo: MESSAGES_REGISTRY.POST.MAXIMUM_EDIT_LIMIT_REACHED("Gist"),
        payload: null,
      };
    }

    gist.status = "UNDER_REVIEW";
    await gist.save({ session });

    const moderationData: IPostModData = {
      postId: gist._id.toString(),
      postType: "GIST",
      userId: userId.toString(),
      caption: caption.trim(),
      media: [],
      topics: gist.topics || [],
      moderationTaskMode: "MODERATE_AND_EXTRACT_TOPICS",
      event: "POST_UPDATE",
    };

    await enqueueModerationTask({
      typename: "moderate:post",
      payload: moderationData,
      redisUrl,
    });

    await session.commitTransaction();

    return {
      status: "SUCCESS_UNDER_REVIEW",
      transInfo:
        MESSAGES_REGISTRY.POST.POST_UPDATE_UNDERGOING_MODERATION_REVIEW("Gist"),
      payload: { gistId: gist._id },
    };
  } catch (error: any) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
