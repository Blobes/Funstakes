import mongoose from "mongoose";
import { FollowModel, UserModel } from "@repo/database";
import {
  getStaticUserList,
  userSensitiveFields,
  userSocialLookup,
  TransInfo,
  MESSAGES_REGISTRY,
  INVALIDATE_CACHE,
} from "@repo/shared";

interface IFollowUserInput {
  currUserId: string;
  targetUserId: string;
}

interface IFollowUserResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: {
    currentUser: any;
    targetUser: any;
  };
}

/**
 * Toggles a follow relationship between users inside an atomic transaction, flushing profile caches.
 */
export const toggleUserFollow = async (
  input: IFollowUserInput,
): Promise<IFollowUserResult> => {
  const { currUserId, targetUserId } = input;

  const followerId = new mongoose.Types.ObjectId(currUserId);
  const followingId = new mongoose.Types.ObjectId(targetUserId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingFollow = await FollowModel.findOne({
      followerId,
      followingId,
    }).session(session);

    let action: "followed" | "unfollowed";

    if (!existingFollow) {
      await FollowModel.create([{ followerId, followingId }], { session });
      await UserModel.findByIdAndUpdate(
        followerId,
        { $inc: { followingCount: 1 } },
        { session },
      );
      await UserModel.findByIdAndUpdate(
        followingId,
        { $inc: { followersCount: 1 } },
        { session },
      );
      action = "followed";
    } else {
      await FollowModel.deleteOne({ _id: existingFollow._id }).session(session);
      await UserModel.findByIdAndUpdate(
        followerId,
        { $inc: { followingCount: -1 } },
        { session },
      );
      await UserModel.findByIdAndUpdate(
        followingId,
        { $inc: { followersCount: -1 } },
        { session },
      );
      action = "unfollowed";
    }

    await session.commitTransaction();
    session.endSession();

    // Evict cached data vectors across target user matching profile entities
    await INVALIDATE_CACHE.forUser({
      userId: targetUserId,
      eventType: "SOCIAL_RELATIONSHIP_UPDATE",
    });

    // Pull refreshed records via normalized static lists aggregation pipelines
    const [rawCurrentUser, rawTargetUser] = await Promise.all([
      UserModel.aggregate(
        getStaticUserList({ matchFilter: { _id: followerId }, limit: 1 }),
      ),
      UserModel.aggregate(
        getStaticUserList({ matchFilter: { _id: followingId }, limit: 1 }),
      ),
    ]);

    const userA = rawCurrentUser[0];
    const userB = rawTargetUser[0];

    if (!userA || !userB) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    // Paint graph structural state values onto response objects
    const decoratedUsers = await userSocialLookup(
      [userA, userB],
      String(currUserId),
    );

    const sensitiveFields = userSensitiveFields();
    const finalPayload = decoratedUsers.map((user: any) => {
      const plainUser = { ...user };
      sensitiveFields.forEach((field) => delete plainUser[field]);
      return plainUser;
    });

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.PROFILE.FOLLOW_TOGGLE_SUCCESS(action),
      payload: {
        currentUser: finalPayload[0],
        targetUser: finalPayload[1],
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
