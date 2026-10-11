import {
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  userSensitiveFields,
  sanitizeUserResult,
  fetchExternalPublicFigure,
} from "@repo/shared";

export interface IUpdateBasicInfoInput {
  authUserId: string;
  displayName?: string;
  about?: string;
  interests?: string[];
  website?: string;
  occupation?: string;
}

interface IUpdateBasicInfoResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: unknown;
  isPotentialPublicFigure?: boolean;
}

/**
 * Recalculates platform notability settings upon identity changes and stores profile mutations.
 */
export const updateAccountBasicInfo = async (
  input: IUpdateBasicInfoInput,
): Promise<IUpdateBasicInfoResult> => {
  const { authUserId, displayName, about, interests, website, occupation } =
    input;

  const user = await fetchSingleUser({
    identifier: authUserId,
    flags: { lean: false },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  let isPotentialPublicFigure = false;
  if (!user.isOnboarded) {
    const updatedDisplayName = displayName || user.displayName;

    const external = await fetchExternalPublicFigure({
      displayName: updatedDisplayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
    const signals = external.data?.signals;
    const notabilityScore = external.data?.notabilityScore || 0;
    isPotentialPublicFigure = notabilityScore >= 60 ? true : false;

    user.publicFigureInfo = {
      isEligible: isPotentialPublicFigure,
      signals,
    };
  }

  if (displayName) user.displayName = displayName;
  if (about !== undefined) user.about = about;
  if (website !== undefined) user.website = website;
  if (occupation !== undefined) user.occupation = occupation;

  // if (interests !== undefined) user.interests = interests; Will update later in the user settings model

  await user.save();

  const safeData = sanitizeUserResult(user, userSensitiveFields());

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.PROFILE.USER_BASIC_DETAILS_UPDATED_SUCCESSFULLY,
    payload: safeData,
    isPotentialPublicFigure,
  };
};
