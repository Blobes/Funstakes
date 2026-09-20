import {
  CACHE_KEYS,
  ensurePrimaryDevice,
  MESSAGES_REGISTRY,
  TransInfo,
  setCache,
  getCache,
  fetchSingleUser,
  ISessionCache,
} from "@repo/shared";

export type OnboardingStep =
  | "INTRO"
  | "WELCOME_BACK"
  | "IDENTITY"
  | "DEMOGRAPHICS"
  | "VISUALS"
  | "PROFESSIONAL";

interface IOnboardingInput {
  userId: string;
  sessionId: string;
  jwtDeviceId: string;
  onboardingStep: OnboardingStep;
  isOnboarded: boolean;
}

interface IOnboardingResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo?: TransInfo;
  payload?: unknown;
}

/**
 * Synchronizes user onboarding tracks, anchors primary devices, and pushes cache updates.
 */
export const syncOnboarding = async (
  input: IOnboardingInput,
): Promise<IOnboardingResult> => {
  const { userId, sessionId, jwtDeviceId, onboardingStep, isOnboarded } = input;

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Anchor verified device context as core identifier if field is empty
  if (!user.primaryDeviceId) {
    await ensurePrimaryDevice(user, jwtDeviceId);

    await setCache(CACHE_KEYS.USER_PRIMARY_DEVICE(userId), jwtDeviceId);
  }

  // Persist pipeline metrics
  user.onboardingStep = onboardingStep;
  user.isOnboarded = isOnboarded || false;
  await user.save();

  // Refresh structural session state expiration parameters
  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
  const sessionData = await getCache<ISessionCache>(sessionKey);

  await setCache(
    sessionKey,
    {
      ...sessionData,
      lastActive: new Date(),
    },
    20 * 24 * 60 * 60,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.ONBOARDING.PROGRESS_SYNCHRONIZED,
    payload: user,
  };
};
