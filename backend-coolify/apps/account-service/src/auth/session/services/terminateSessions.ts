import {
  cleanDeviceSessions,
  removeSession,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

interface ILogoutInput {
  userId: string;
  currentSessionId?: string;
  jwtDeviceId?: string;
  targetDeviceId?: string;
  logoutAll?: boolean;
}

interface ILogoutResult {
  status: "SUCCESS";
  transInfo?: TransInfo;
  shouldClearCookies: boolean;
}

/**
 * Executes the core session termination business rules.
 */
export const terminateUserSessions = async (
  input: ILogoutInput,
): Promise<ILogoutResult> => {
  const { userId, currentSessionId, jwtDeviceId, targetDeviceId, logoutAll } =
    input;

  // Evaluate if the operation targets the current device session
  const isCurrentDevice = !targetDeviceId || targetDeviceId === jwtDeviceId;

  if (logoutAll) {
    await cleanDeviceSessions(userId, undefined, { clearAll: true });
  } else if (targetDeviceId && !isCurrentDevice) {
    await cleanDeviceSessions(userId, targetDeviceId);
  } else if (currentSessionId) {
    await removeSession(userId, currentSessionId);
  }

  const shouldClearCookies = logoutAll || isCurrentDevice;

  const feedbackMsg = logoutAll
    ? MESSAGES_REGISTRY.AUTH.LOGGED_OUT_OF_ALL_DEVICES_SUCCESSFULLY
    : MESSAGES_REGISTRY.AUTH.DEVICE_SESSION_TERMINATED;

  return {
    status: "SUCCESS",
    transInfo: feedbackMsg,
    shouldClearCookies,
  };
};
