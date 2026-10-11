import { Types } from "mongoose";
import {
  UserModel,
  DeviceModel,
  AccountStatusHistoryModel,
  MediaModel,
  UserLogModel,
  FollowModel,
  BlockedModel,
  KycRequestModel,
  UserRoleModel,
  BookmarkModel,
  StakeModel,
  PostViewModel,
  DEVICE_NESTED_FIELDS,
} from "@repo/database";
import { IS3Config, TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { cleanDeviceSessions } from "../session";
import { hardDeleteMedia } from "../media/hardDelete";
import { checkUserExists } from "./retrieve/fetchUser";

export interface IAccountDeletionInput {
  targetUserId: string;
  s3Config: IS3Config;
}

export interface IAccountDeletionResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo?: TransInfo;
}

/**
 * Permanently purges all user profile states, S3 bucket assets, social connections, roles, and session caches.
 */
export const executeAccountDeletion = async (
  input: IAccountDeletionInput,
): Promise<IAccountDeletionResult> => {
  const { targetUserId, s3Config } = input;
  const userObjectId = new Types.ObjectId(targetUserId);

  const userExists = await checkUserExists({
    identifier: targetUserId,
    flags: { skipFilter: true },
  });

  if (!userExists) {
    return {
      status: "NOT_FOUND",
      ...MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Retrieve all file markers owned by this user to clear third-party storage allocations
  const userMediaAssets = await MediaModel.find({ ownerId: userObjectId })
    .select("_id")
    .lean();

  // Flush active memory caches and session nodes concurrently
  await Promise.all([
    cleanDeviceSessions(targetUserId, undefined, { clearAll: true }),
  ]);

  // Execute hard deletes across cloud S3 buckets and local document records for files
  if (userMediaAssets.length > 0) {
    await Promise.all(
      userMediaAssets.map((asset) =>
        hardDeleteMedia({
          mediaId: asset._id,
          s3Config,
        }),
      ),
    );
  }

  // Execute hard deletes across collections owned entirely by the target user
  await Promise.all([
    UserModel.findByIdAndDelete(targetUserId),
    DeviceModel.deleteMany({
      [DEVICE_NESTED_FIELDS.USERS_USER_ID]: targetUserId,
    }),
    AccountStatusHistoryModel.deleteMany({ account: userObjectId }),
    UserLogModel.deleteMany({ userId: userObjectId }),
    KycRequestModel.deleteMany({ userId: userObjectId }),
    UserRoleModel.deleteMany({ userId: userObjectId }),
    BookmarkModel.deleteMany({ userId: userObjectId }),
    StakeModel.deleteMany({ userId: userObjectId }),
    PostViewModel.deleteMany({ userId: userObjectId }),
  ]);

  // Execute bidirectional drops across symmetrical social graph mechanics
  await Promise.all([
    FollowModel.deleteMany({
      $or: [{ followerId: userObjectId }, { followingId: userObjectId }],
    }),
    BlockedModel.deleteMany({
      $or: [{ blockerId: userObjectId }, { blockedId: userObjectId }],
    }),
  ]);

  return {
    status: "SUCCESS",
    ...MESSAGES_REGISTRY.AUTH.ACCOUNT_DELETED_SUCCESSFULLY,
  };
};
