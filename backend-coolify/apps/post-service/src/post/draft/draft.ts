import { Model } from "mongoose";
import {
  GistModel,
  PostModelType,
  PostVisibility,
  StakeModel,
} from "@repo/database";
import { MESSAGES_REGISTRY, PostType, TransInfo } from "@repo/shared";

export interface DraftPostInput {
  userId?: string;
  postId?: string;
  caption?: string;
  topics?: string[];
  postType: PostType;
  msgPostType: PostModelType;
}

export interface DraftPostResult {
  status:
    | "INVALID_SESSION"
    | "NOT_FOUND"
    | "SUCCESS_CREATED"
    | "SUCCESS_UPDATED";
  transInfo: TransInfo;
  payload: any;
}

const MODEL_REGISTRY: Record<PostType, Model<any>> = {
  GIST: GistModel,
  STAKE: StakeModel, // Fallback placeholder context configuration until StakeModel is introduced
};

/**
 * Handles generic draft persistence operations by dynamically resolving the database model using the postType.
 */
export const executeDraftPost = async (
  input: DraftPostInput,
): Promise<DraftPostResult> => {
  const { userId, postId, caption, topics, postType, msgPostType } = input;

  if (!userId) {
    return {
      status: "INVALID_SESSION",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_SESSION(msgPostType),
      payload: null,
    };
  }

  // Resolve the target domain model from the registry mapping structure
  const model = MODEL_REGISTRY[postType];
  const updateFields = {
    authorId: userId,
    visibility: "DRAFT" as PostVisibility,
    latestCaption: caption ? { caption: caption.trim() } : undefined,
    mediaIds: [],
    topics: topics || [],
  };

  let draftedRecord;

  if (postId) {
    draftedRecord = await model.findOneAndUpdate(
      { _id: postId, authorId: userId },
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!draftedRecord) {
      return {
        status: "NOT_FOUND",
        transInfo:
          MESSAGES_REGISTRY.POST.DRAFT_NOT_FOUND_OR_UNAUTHORIZED(msgPostType),
        payload: null,
      };
    }

    return {
      status: "SUCCESS_UPDATED",
      transInfo: MESSAGES_REGISTRY.POST.DRAFT_UPDATED_SUCCESSFULLY(msgPostType),
      payload: { postId: draftedRecord._id },
    };
  }

  draftedRecord = await model.create(updateFields);

  return {
    status: "SUCCESS_CREATED",
    transInfo: MESSAGES_REGISTRY.POST.DRAFT_SAVED_SUCCESSFULLY(msgPostType),
    payload: { postId: draftedRecord._id },
  };
};
