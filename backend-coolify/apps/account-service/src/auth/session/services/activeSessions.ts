import {
  findUserSessions,
  ISessionCache,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

interface ISessionItem extends ISessionCache {
  sessionId: string;
  isCurrentDevice: boolean;
}

interface IActiveSessionsResult {
  status: "SUCCESS" | "UNAUTHORIZED";
  transInfo?: TransInfo;
  payload?: ISessionItem[];
}

/**
 * Retrieves all active user sessions from cache storage and highlights the current device session context.
 */
export const fetchActiveSessions = async (
  userId: string | undefined,
  currentSessionId: string | undefined,
): Promise<IActiveSessionsResult> => {
  if (!userId) {
    return {
      status: "UNAUTHORIZED",
      transInfo: MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
    };
  }

  const allSessions = await findUserSessions(userId);

  const sessions: ISessionItem[] = allSessions.map(({ sessionId, data }) => ({
    sessionId,
    deviceId: data.deviceId,
    isCurrentDevice: sessionId === currentSessionId,
    userAgent: data.userAgent,
    ip: data.ip,
    lastActive: data.lastActive,
    createdAt: data.createdAt,
  }));

  const sortedSessions = sessions.sort((a, b) =>
    a.isCurrentDevice === b.isCurrentDevice ? 0 : a.isCurrentDevice ? -1 : 1,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.SESSIONS_RETRIEVED,
    payload: sortedSessions,
  };
};
