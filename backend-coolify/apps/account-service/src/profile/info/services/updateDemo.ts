import { TransInfo, MESSAGES_REGISTRY, fetchSingleUser } from "@repo/shared";

export interface IUpdateDemoInfoInput {
  authUserId: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  relationship?: string;
}

interface IUpdateDemoInfoResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: unknown;
}

/**
 * Persists user demographic modifications, evicts runtime profile caches, and sanitizes outgoing documents.
 */
export const updateAccountDemoInfo = async (
  input: IUpdateDemoInfoInput,
): Promise<IUpdateDemoInfoResult> => {
  const { authUserId, gender, dateOfBirth, address, relationship } = input;

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

  if (gender !== undefined) user.gender = gender;
  if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
  if (address !== undefined) user.address = address;
  if (relationship !== undefined) user.relationship = relationship;

  await user.save();

  // Fetch lean sanitized paload using default repository sanitization flags
  const updatedLeanUser = await fetchSingleUser({
    identifier: authUserId,
    flags: { lean: true, includeSensitiveFields: false },
  });

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.PROFILE.DEMOGRAPHIC_INFORMATION_UPDATED_SUCCESSFULLY,
    payload: updatedLeanUser,
  };
};
