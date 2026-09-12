import {
  detectIdentifierType,
  fetchSingleUser,
  MESSAGES_REGISTRY,
  totpService,
  TransInfo,
} from "@repo/shared";
import { TotpActionType } from "./setupTotp";

export interface ITotpVerificationInput {
  actionType: TotpActionType;
  token: string;
  identifier?: string;
  userId?: string;
}

export interface ITotpVerificationResult {
  status:
    | "SUCCESS"
    | "MISSING_INPUT"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_TOKEN"
    | "INVALID_IDENTIFIER";
  transInfo: TransInfo;
  payload: {
    isRecovery?: boolean;
    backupCodes?: string[];
  } | null;
}

/**
 * Validates provided TOTP tokens or backup recovery codes against user configurations based on the requested purpose.
 */
export const executeTotpVerification = async (
  input: ITotpVerificationInput,
): Promise<ITotpVerificationResult> => {
  const { actionType, token, identifier, userId } = input;

  if (!token) {
    return {
      status: "MISSING_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.MISSING_TOKEN,
      payload: null,
    };
  }

  if (actionType === "AUTHENTICATE") {
    if (!identifier) {
      return {
        status: "MISSING_INPUT",
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
        lean: false,
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

    // Checking if the target authentication profile is properly configured to execute context verification
    if (!user.hasEnabledMFA || !user.totpAuth?.secret) {
      return {
        status: "RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.TOTP_NOT_ENABLED,
        payload: null,
      };
    }

    // Checking backup codes first in case access to the authenticator device is lost
    const backupCodes = user.totpAuth.backupCodes || [];
    const normalizedToken = token.toUpperCase();
    const matchingBackupIndex = backupCodes.indexOf(normalizedToken);

    if (matchingBackupIndex !== -1) {
      // Revoking the used code immediately to prevent replay attacks and re-use vectors
      backupCodes.splice(matchingBackupIndex, 1);
      user.totpAuth.backupCodes = backupCodes;
      await user.save();

      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.TOTP_RECOVERY_SUCCESS,
        payload: { isRecovery: true },
      };
    }

    // Falling back to live cryptographic checking windows for standard TOTP verification
    const isValid = totpService.verifyToken(token, user.totpAuth.secret);

    if (!isValid) {
      return {
        status: "INVALID_TOKEN",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_TOKEN,
        payload: null,
      };
    }

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.TOTP_VERIFICATION_SUCCESS,
      payload: { isRecovery: false },
    };
  }

  // Handling the TOTP registration and finalization setup flow
  if (!userId) {
    return {
      status: "MISSING_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: true },
  });

  if (!user || !user.totpAuth.tempSecret) {
    return {
      status: "RESTRICTION",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_LIFECYCLE_SEQUENCE,
      payload: null,
    };
  }

  // Validating token against the transient secret generated during the initiation phase
  const isValid = totpService.verifyToken(token, user.totpAuth.tempSecret);

  if (!isValid) {
    return {
      status: "INVALID_TOKEN",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_TOKEN,
      payload: null,
    };
  }

  // Committing transient metrics into definitive active security parameters
  user.totpAuth = {
    ...user.totpAuth,
    secret: user.totpAuth.tempSecret,
    backupCodes: user.totpAuth.tempBackupCodes || [],
  };
  user.hasEnabledMFA = true;

  const backupCodesToReturn = user.totpAuth.tempBackupCodes || [];

  // Nullifying transient fields to secure the registration state
  user.totpAuth.tempSecret = null;
  user.totpAuth.tempBackupCodes = [];

  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.TOTP_SETUP_FINALIZED,
    payload: {
      backupCodes: backupCodesToReturn,
    },
  };
};
