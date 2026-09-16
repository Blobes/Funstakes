import { ModerationDecision } from "@repo/database";
import {
  getOrSetCache,
  userSocialLookup,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
  CACHE_EXPIRY,
  fetchSingleUser,
  validateAccountStatus,
} from "@repo/shared";

interface IGetUserProfileInput {
  targetUserId: string;
  authUserId?: string;
}

interface IGetUserProfileResult {
  status?:
    | "SUCCESS"
    | "NOT_FOUND"
    | "ACCOUNT_ACTIVE"
    | "ACCOUNT_INACTIVE"
    | ModerationDecision;
  transInfo?: TransInfo;
  payload?: any;
}

/**
 * Orchestrates cache lookups, database aggregations, relationship styling, and conditional privacy pruning.
 */
export const executeUserProfileFetch = async (
  input: IGetUserProfileInput,
): Promise<IGetUserProfileResult> => {
  const { targetUserId, authUserId } = input;
  const isOwner = authUserId === targetUserId;
  const cacheKey = CACHE_KEYS.USER_PROFILE(targetUserId);

  // Retrieve cached records or query using fetchUser
  const baseProfile = await getOrSetCache(
    cacheKey,
    async () => {
      return await fetchSingleUser({
        identifier: targetUserId,
        flags: {
          includeLanguage: true,
          includePrivateFields: isOwner ? true : false,
        },
      });
    },
    CACHE_EXPIRY.HOUR_1,
  );

  if (!baseProfile) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  // Intercept data processing paths early if account parameters mark deactivation
  const accountStatus = baseProfile.accountStatus;
  const { isRestricted, status, transInfo } = validateAccountStatus({
    accountStatus: accountStatus,
    mode: "RESTRICTED",
  });
  if (isRestricted) {
    return {
      status,
      transInfo,
      payload: {
        _id: baseProfile._id,
        username: baseProfile.username,
        profileImage: baseProfile.profileImage,
        firstName: baseProfile.firstName,
        lastName: baseProfile.lastName,
        isOwner,
      },
    };
  }

  // Paint following flags using graph relational connections
  const userProfile = await userSocialLookup(
    { ...baseProfile, isOwner },
    authUserId,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.USER_FETCHED_SUCCESSFULLY,
    payload: userProfile,
  };
};
