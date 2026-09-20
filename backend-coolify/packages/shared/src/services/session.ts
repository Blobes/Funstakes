import { CACHE_KEYS } from "../constants/cacheKeys";
import { ISessionCache } from "../types/general";
import {
  deleteCache,
  getCache,
  pipelineGetCache,
  scanCache,
} from "./redis/cache/helpers";

interface SessionCleanupOptions {
  userId: string;
  currentSessionId?: string;
  keepCurrentIfPrimary?: boolean;
  primarySessionId?: string | null;
}
/**
 * Terminates sessions for a user based on specific preservation rules.
 * Uses a single batch deletion to minimize network round-trips.
 */
export const cleanUserSessions = async ({
  userId,
  currentSessionId,
  keepCurrentIfPrimary = false,
  primarySessionId,
}: SessionCleanupOptions): Promise<boolean> => {
  try {
    let keptCurrentSession = false;

    // 1. Fetch all sessions using the reusable utility
    const allSessions = await findUserSessions(userId);

    // 2. Identify keys that need to be deleted
    const keysToDelete: string[] = [];

    for (const session of allSessions) {
      const { key, sessionId } = session;

      // Check if we should preserve the current session
      const isCurrentPrimary =
        keepCurrentIfPrimary &&
        sessionId === currentSessionId &&
        currentSessionId === primarySessionId;

      if (isCurrentPrimary) {
        keptCurrentSession = true;
        continue; // Skip adding to delete list
      }

      keysToDelete.push(key);
    }

    // 3. Perform batch deletion
    if (keysToDelete.length > 0) {
      await deleteCache(keysToDelete);
    }

    return keptCurrentSession;
  } catch (error) {
    console.error("Session Cleanup Utility Error:", error);
    throw new Error("Failed to process session cleanup");
  }
};

export const removeSession = async (
  userId: string,
  targetSessionId: string,
) => {
  await deleteCache(CACHE_KEYS.USER_SESSION(userId, targetSessionId));
};

/**
 * Scans Redis for all sessions belonging to a user and returns their data.
 */
// export const findUserSessions = async (
//   userId: string,
//   filter?: (session: any) => boolean,
// ): Promise<{ key: string; sessionId: string; data: any }[]> => {
//   const pattern = CACHE_KEYS.WILDCARD_USER_SESSIONS(userId);
//   let cursor = "0";
//   const matches: { key: string; sessionId: string; data: any }[] = [];

//   do {
//     const [nextCursor, keys] = await scanCache(cursor, pattern, 100);

//     if (keys.length > 0) {
//       const sessions = await pipelineGetCache(keys);

//       sessions.forEach((session, index) => {
//         if (session) {
//           const include = filter ? filter(session) : true;
//           if (include) {
//             matches.push({
//               key: keys[index],
//               sessionId: keys[index].split(":").pop() || "",
//               data: session,
//             });
//           }
//         }
//       });
//     }
//     cursor = nextCursor;
//   } while (cursor !== "0");

//   return matches;
// };

export const findUserSessions = async (
  userId: string,
  filter?: (session: ISessionCache) => boolean,
): Promise<{ key: string; sessionId: string; data: ISessionCache }[]> => {
  const pattern = CACHE_KEYS.WILDCARD_USER_SESSIONS(userId);
  let cursor = "0";
  const matches: { key: string; sessionId: string; data: ISessionCache }[] = [];

  do {
    const [nextCursor, keys] = await scanCache(cursor, pattern, 100);

    if (keys.length > 0) {
      const sessions = await pipelineGetCache<ISessionCache>(keys);

      sessions.forEach((session, index) => {
        if (session) {
          const include = filter ? filter(session) : true;
          if (include) {
            matches.push({
              key: keys[index],
              sessionId: keys[index].split(":").pop() || "",
              data: session,
            });
          }
        }
      });
    }
    cursor = nextCursor;
  } while (cursor !== "0");

  return matches;
};

/**
 * Terminates sessions tied to specific hardware IDs or clears all hardware sessions.
 * Optionally preserves the primary device session even during a global clear.
 */
export const cleanDeviceSessions = async (
  userId: string,
  targetDeviceIds?: string | string[],
  options: {
    clearAll?: boolean;
    preservePrimary?: boolean;
    primaryDeviceId?: string | null;
  } = {},
): Promise<boolean> => {
  const {
    clearAll = false,
    preservePrimary = false,
    primaryDeviceId = null,
  } = options;

  try {
    const allSessions = await findUserSessions(userId);
    if (allSessions.length === 0) return false;

    const targetIds = Array.isArray(targetDeviceIds)
      ? targetDeviceIds
      : targetDeviceIds
        ? [targetDeviceIds]
        : [];

    const sessionDataResults = await Promise.all(
      allSessions.map(async (s) => ({
        key: s.key,
        sessionId: s.sessionId,
        data: (await getCache<ISessionCache>(s.key)) as ISessionCache | null,
      })),
    );

    const keysToDelete: string[] = [];
    let wasPrimaryPreserved = false;

    for (const { key, data } of sessionDataResults) {
      if (!data) continue;

      // Check if this specific session belongs to the primary device
      const isPrimaryDevice =
        primaryDeviceId && data.deviceId === primaryDeviceId;

      // Preservation Logic: Skip deletion if it's the primary device and we flagged it for preservation
      if (preservePrimary && isPrimaryDevice) {
        wasPrimaryPreserved = true;
        continue;
      }

      const shouldDelete =
        clearAll || (targetIds.length > 0 && targetIds.includes(data.deviceId));

      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      await deleteCache(keysToDelete);
    }
    return wasPrimaryPreserved;
  } catch (error) {
    console.error("Device Session Cleanup Error:", error);
    throw new Error("Failed to process hardware-based session cleanup");
  }
};
