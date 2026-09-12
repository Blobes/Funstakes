import {
  detectIdentifierType,
  fetchSingleUser,
  getAccountStatusMsg,
  MESSAGES_REGISTRY,
  totpService,
  TransInfo,
} from "@repo/shared";

export type TotpActionType = "AUTHENTICATE" | "CONFIGURE";

export interface ITotpSetupInput {
  actionType: TotpActionType;
  identifier?: string;
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
export const executeTotpSetup = async (
  input: ITotpSetupInput,
): Promise<ITotpSetupResult> => {
  const { actionType, identifier, userId } = input;

  if (actionType === "AUTHENTICATE") {
    if (!identifier) {
      return {
        status: "MISSING_IDENTIFIER",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
        payload: null,
      };
    }

    const isEmail = detectIdentifierType(identifier) === "EMAIL";
    const isPhone = detectIdentifierType(identifier) === "PHONE_NUMBER";

    if (!isEmail && !isPhone) {
      return {
        status: "INVALID_IDENTIFIER",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_EMAIL_OR_PHONE,
        payload: null,
      };
    }

    const user = await fetchSingleUser({
      identifier,
      flags: {
        lean: true,
        identifierType: isEmail ? "EMAIL" : "PHONE_NUMBER",
        skipFilter: true,
      },
    });

    if (!user) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
        payload: null,
      };
    }

    const accountStatus = user.accountStatus;
    if (
      accountStatus === "DEACTIVATED" ||
      accountStatus === "SUSPENDED" ||
      accountStatus === "BANNED"
    ) {
      const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
      return {
        status: "RESTRICTION",
        transInfo: restrictionMsg.transInfo,
        payload: null,
      };
    }

    if (!user.hasEnabledMFA || !user.totpAuth?.secret) {
      return {
        status: "RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.TOTP_NOT_ENABLED,
        payload: null,
      };
    }

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.TOTP_RETRIEVAL_SUCCESS,
      payload: {
        qrCodeDataUrl: null,
        manualEntryKey: null,
        isMfaActive: true,
      },
    };
  }

  if (!userId) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

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
