import {
  fetchSingleUser,
  MESSAGES_REGISTRY,
  totpService,
  TransInfo,
} from "@repo/shared";

export type TotpActionType = "AUTHENTICATE" | "CONFIGURE";

export interface ITotpSetupInput {
  userId?: string;
}

export interface ITotpSetupResult {
  status:
    | "SUCCESS"
    | "MISSING_IDENTIFIER"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_IDENTIFIER";
  transInfo: TransInfo;
  payload: {
    qrCodeDataUrl: string | null;
    manualEntryKey: string | null;
    isMfaActive: boolean;
  } | null;
}

/**
 * Orchestrates authenticator challenges and registration setups based on intent context.
 */
export const executeTotpFetch = async (
  input: ITotpSetupInput,
): Promise<ITotpSetupResult> => {
  const { userId } = input;

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  const { secret, qrCodeDataUrl, backupCodes } =
    await totpService.generateSetupPayload(user.email, "Funstakes");

  user.totpAuth.tempSecret = secret;
  user.totpAuth.tempBackupCodes = backupCodes;
  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.TOTP_SETUP_SUCCESS,
    payload: {
      qrCodeDataUrl,
      manualEntryKey: secret,
      isMfaActive: user.hasEnabledMFA || false,
    },
  };
};
