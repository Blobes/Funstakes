import {
  GistModel,
  StakeModel,
  UserModel,
  DeviceModel,
  CommentModel,
} from "@repo/database";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  getOrSetCache,
  IAuthRequest,
  IGistResource,
  IStakeResource,
  IUserProfileResource,
  IDeviceResource,
  ICommentResource,
  MESSAGES_REGISTRY,
  createDomainError,
} from "@repo/shared";

/**
 * Extracts and normalizes a parameter value from the request params to a single string.
 */
const getParamString = (req: IAuthRequest, paramKey: string): string => {
  const param = req.params[paramKey];
  return Array.isArray(param) ? (param[0] ?? "") : (param ?? "");
};

/**
 * Loads a Gist entity by parameter ID and maps state flags for ReBAC evaluations.
 */
export const loadGistResource = (paramKey = "id") => {
  return async (req: IAuthRequest): Promise<IGistResource> => {
    const gistId = getParamString(req, paramKey);
    const cacheKey = CACHE_KEYS.POST_RESOURCE(gistId, "Gist");

    return getOrSetCache<IGistResource>(
      cacheKey,
      async () => {
        const gist = await GistModel.findById(gistId).lean();

        if (!gist) {
          const transMsg = MESSAGES_REGISTRY.POST.POST_NOT_FOUND("Gist");
          throw createDomainError(
            transMsg.message as string,
            transMsg.i18nKey as string,
            401,
          );
        }

        return {
          type: "GIST",
          gistId: gist._id.toString(),
          authorId: gist.authorId.toString(),
          visibility: gist.visibility,
          isDeleted: gist.status === "DELETED",
          isArchived: gist.status === "ARCHIVED",
          isSuspended:
            gist.status === "BANNED" || gist.status === "SHADOWBANNED",
        };
      },
      CACHE_EXPIRY.MIN_20,
    );
  };
};

/**
 * Loads a Stake entity by parameter ID and maps state flags for ReBAC evaluations.
 */
export const loadStakeResource = (paramKey = "id") => {
  return async (req: IAuthRequest): Promise<IStakeResource> => {
    const stakeId = getParamString(req, paramKey);
    const cacheKey = CACHE_KEYS.POST_RESOURCE(stakeId, "Stake");

    return getOrSetCache<IStakeResource>(
      cacheKey,
      async () => {
        const stake = await StakeModel.findById(stakeId).lean();

        if (!stake) {
          const transMsg = MESSAGES_REGISTRY.POST.POST_NOT_FOUND("Stake");
          throw createDomainError(
            transMsg.message as string,
            transMsg.i18nKey as string,
            404,
          );
        }

        return {
          type: "STAKE",
          stakeId: stake._id.toString(),
          authorId: stake.authorId.toString(),
          parentPostId: stake.postId ? stake.postId.toString() : undefined,
          parentPostType: stake.postType ?? undefined,
          visibility: stake.visibility,
          isDeleted: stake.status === "DELETED",
          isArchived: stake.status === "ARCHIVED",
          isSuspended:
            stake.status === "BANNED" || stake.status === "SHADOWBANNED",
        };
      },
      CACHE_EXPIRY.MIN_20,
    );
  };
};

/**
 * Loads a User Profile entity and maps accountStatus to generic base resource state flags.
 */
export const loadUserResource = (paramKey = "id") => {
  return async (req: IAuthRequest): Promise<IUserProfileResource> => {
    const userId = getParamString(req, paramKey);
    const cacheKey = CACHE_KEYS.USER_PROFILE_RESOURCE(userId);

    return getOrSetCache<IUserProfileResource>(
      cacheKey,
      async () => {
        const user = await UserModel.findById(userId).lean();

        if (!user) {
          const transMsg = MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND;
          throw createDomainError(
            transMsg.message as string,
            transMsg.i18nKey as string,
            404,
          );
        }

        return {
          type: "USER_PROFILE",
          targetUserId: user._id.toString(),
          isPrivateAccount: user.accountVisibility === "PRIVATE",
          isDeleted: user.accountStatus === "DEACTIVATED",
          isArchived: user.accountStatus === "INACTIVE",
          isSuspended:
            user.accountStatus === "SUSPENDED" ||
            user.accountStatus === "BANNED",
        };
      },
      CACHE_EXPIRY.MIN_30,
    );
  };
};

/**
 * Loads a Device entity by parameter ID and maps state flags for ReBAC evaluations.
 */
export const loadDeviceResource = (paramKey = "id") => {
  return async (req: IAuthRequest): Promise<IDeviceResource> => {
    const deviceId = getParamString(req, paramKey);
    const requestingUserId = req.user?.id;
    const cacheKey = CACHE_KEYS.DEVICE_RESOURCE(deviceId);

    return getOrSetCache<IDeviceResource>(
      cacheKey,
      async () => {
        const device = await DeviceModel.findById(deviceId).lean();

        if (!device) {
          const transMsg = MESSAGES_REGISTRY.AUTH.DEVICE_NOT_FOUND;
          throw createDomainError(
            transMsg.message as string,
            transMsg.i18nKey as string,
            404,
          );
        }

        // Resolving owner context for ReBAC evaluation from multi-user array
        const userMeta = device.users.find(
          (u) => u.userId.toString() === requestingUserId,
        );
        const primaryUserMeta = device.users.find((u) => u.isPrimary);

        const resolvedOwnerId =
          userMeta?.userId.toString() ??
          primaryUserMeta?.userId.toString() ??
          device.users[0]?.userId.toString() ??
          "";

        return {
          type: "DEVICE",
          deviceId: device._id.toString(),
          ownerId: resolvedOwnerId,
          isDeleted: false,
          isArchived: device.isStale,
          isSuspended: false,
        };
      },
      CACHE_EXPIRY.MIN_20,
    );
  };
};

/**
 * Loads a Comment entity by parameter ID and maps state flags for ReBAC evaluations.
 */
export const loadCommentResource = (paramKey = "id") => {
  return async (req: IAuthRequest): Promise<ICommentResource> => {
    const commentId = getParamString(req, paramKey);
    const cacheKey = CACHE_KEYS.COMMENT_RESOURCE(commentId);

    return getOrSetCache<ICommentResource>(
      cacheKey,
      async () => {
        const comment = await CommentModel.findById(commentId).lean();

        if (!comment) {
          const transMsg = MESSAGES_REGISTRY.POST.COMMENT_NOT_FOUND;
          throw createDomainError(
            transMsg.message as string,
            transMsg.i18nKey as string,
            404,
          );
        }

        return {
          type: "COMMENT",
          commentId: comment._id.toString(),
          authorId: comment.authorId.toString(),
          parentPostId: comment.postId.toString(),
          parentPostType: comment.postType,
          visibility: comment.visibility,
          isDeleted: comment.status === "DELETED",
          isArchived: comment.status === "ARCHIVED",
          isSuspended:
            comment.status === "BANNED" || comment.status === "SHADOWBANNED",
        };
      },
      CACHE_EXPIRY.MIN_20,
    );
  };
};
