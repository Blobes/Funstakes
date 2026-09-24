import { authTokens } from "@/envVars";
import { ILocation, IUserDocument, UserModel } from "@repo/database";
import {
  RestrictionStatus,
  fetchSingleUser,
  MESSAGES_REGISTRY,
  sanitizeUserResult,
  TransInfo,
  upsertDevice,
  userSensitiveFields,
  validateAccountStatus,
  INVALIDATE_CACHE,
  validateDeviceTrust,
  VerificationMethod,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { executeAccountCheck } from "../check/service";
import {
  IOAuthProfile,
  verifyAppleToken,
  verifyGoogleToken,
} from "./oAuthConfig";
import { issueAuthTokens } from "@repo/security";
import mongoose from "mongoose";
import { syncDefaultRole } from "../helpers/syncRole";

export type OAuthProvider = "GOOGLE" | "APPLE";
export type OAuthPurpose = "REGISTRATION" | "LOGIN";

const TRUST_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface IOauthInput {
  provider: OAuthProvider;
  idToken: string;
  deviceToken: string;
  userAgent: string;
  ipAddress: string;
  location?: ILocation;
  purpose?: OAuthPurpose;
  identityPayload?: {
    firstName?: string;
    lastName?: string;
  };
}

interface IoAuthResult {
  status?:
    | RestrictionStatus
    | "SUCCESS"
    | "MERGE_RESTRICTION"
    | "USER_NOT_FOUND"
    | "UNSUPPORTED_OAUTH_PROVIDER"
    | "ACCOUNT_ALREADY_EXISTS"
    | "INVALID_OAUTH_TOKEN";
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  deviceId?: string;
  isNewUser?: boolean;
  requireVerification?: boolean;
  verificationMethods?: VerificationMethod[];
  verificationReason?: "UNVERIFIED_ACCOUNT" | "UNTRUSTED_DEVICE";
  payload?: any;
}

/**
 * Validates third-party provider ID tokens and adaptively logs in existing users or provisions new accounts.
 */
export const authenticateWithOAuth = async (
  input: IOauthInput,
): Promise<IoAuthResult> => {
  const {
    provider,
    idToken,
    deviceToken,
    userAgent,
    ipAddress,
    location,
    purpose,
    identityPayload,
  } = input;

  let profile: IOAuthProfile;

  // Verify provider identity token
  try {
    if (provider === "GOOGLE") {
      profile = await verifyGoogleToken(idToken);
    } else if (provider === "APPLE") {
      profile = await verifyAppleToken(idToken);
      if (identityPayload) {
        profile.firstName = profile.firstName || identityPayload.firstName;
        profile.lastName = profile.lastName || identityPayload.lastName;
      }
    } else {
      return {
        status: "UNSUPPORTED_OAUTH_PROVIDER",
        transInfo: MESSAGES_REGISTRY.AUTH.UNSUPPORTED_OAUTH_PROVIDER,
      };
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_OAUTH_TOKEN") {
      return {
        status: "INVALID_OAUTH_TOKEN",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OAUTH_TOKEN,
      };
    }
    throw error;
  }

  const isProviderEmailVerified = Boolean(profile.emailVerified);

  // Check if an account already exists for the verified email
  const checkResult = await executeAccountCheck({
    identifierType: "EMAIL",
    identifier: profile.email,
    purpose,
  });

  // --- PATH A: Account Does NOT Exist (Automatic Registration) ---
  if (!checkResult.isExisting || checkResult.status === "NOT_FOUND") {
    if (purpose === "LOGIN") {
      return {
        status: "USER_NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
        payload: {
          email: profile.email,
          provider,
          idToken,
        },
      };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newUser: IUserDocument = new UserModel({
        email: profile.email,
        oAuthId: profile.providerId,
        signedUpWith: provider,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        isEmailVerified: isProviderEmailVerified,
        location,
        lastActiveAt: new Date(),
      });
      await newUser.save({ session });

      // Directly provision baseline entitlements for fresh OAuth account
      await syncDefaultRole(newUser._id, { session, skipCheck: true });

      const device = await upsertDevice({
        user: newUser,
        deviceToken,
        userAgent,
        session,
        markAsVerified: isProviderEmailVerified ? true : false,
      });

      await session.commitTransaction();

      const deviceIdString = device._id.toString();

      const { accessToken, refreshToken } = await issueAuthTokens({
        user: newUser,
        deviceId: deviceIdString,
        sessionId: uuidv4(),
        userAgent,
        ipAddress,
        authTokens,
      });

      const safeData = sanitizeUserResult(newUser, userSensitiveFields());

      return {
        status: "SUCCESS",
        transInfo:
          MESSAGES_REGISTRY.AUTH.REGISTRATION_SUCCESSFUL_VIA_OAUTH(provider),
        accessToken,
        refreshToken,
        deviceId: deviceIdString,
        isNewUser: true,
        requireVerification: !isProviderEmailVerified,
        payload: safeData,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- PATH B: Account Exists (Automatic Login) ---
  // Intercept registration intent when email already exists
  if (purpose === "REGISTRATION") {
    return {
      status: "ACCOUNT_ALREADY_EXISTS",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED,
      payload: {
        email: profile.email,
        provider,
        idToken,
      },
    };
  }

  const accountStatus = checkResult.payload?.accountStatus;

  // Enforce restriction status validation (bans, suspensions, deactivations)
  const { isRestricted, status, transInfo } = validateAccountStatus({
    accountStatus,
    mode: "RESTRICTED",
  });
  if (isRestricted) {
    return { status, transInfo };
  }

  const user = await fetchSingleUser({
    identifier: checkResult.payload?.userId,
    flags: {
      lean: false,
      skipFilter: true,
      includeSensitiveFields: true,
    },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Prevent account hijacking if traditional account email is still unverified
  if (
    user.signedUpWith === "EMAIL" &&
    !user.isEmailVerified &&
    !isProviderEmailVerified
  ) {
    return {
      status: "MERGE_RESTRICTION",
      transInfo: MESSAGES_REGISTRY.AUTH.OAUTH_ACCOUNT_CONFLICT(provider),
    };
  }

  // Prevent conflicting OAuth provider mapping
  if (
    user.signedUpWith &&
    user.signedUpWith !== "EMAIL" &&
    user.signedUpWith !== provider
  ) {
    return {
      status: "MERGE_RESTRICTION",
      transInfo: MESSAGES_REGISTRY.AUTH.OAUTH_PROVIDER_CONFLICT(provider),
    };
  }

  const userId = user._id.toString();

  // Mark email as verified if provider confirms ownership and local status is false
  if (!user.isEmailVerified && isProviderEmailVerified) {
    user.isEmailVerified = true;
  }

  // Bind OAuth provider ID if missing without altering original signedUpWith method
  if (!user.oAuthId) {
    user.oAuthId = profile.providerId;
  }

  // Idempotently guarantee baseline role and entitlements
  await syncDefaultRole(user._id);

  // Determine if user has configured step-up security options (e.g., TOTP or security questions)
  const hasConfiguredMfa =
    user.hasEnabledMFA &&
    Boolean(user.totpAuth.secret || user.securityQuestionsId);

  const device = await upsertDevice({
    user,
    deviceToken,
    userAgent,
    markAsVerified: !hasConfiguredMfa && isProviderEmailVerified ? true : false,
  });
  const deviceIdString = device._id.toString();

  const { isTrusted: isDeviceTrusted } = await validateDeviceTrust(
    userId,
    deviceToken,
    deviceIdString,
  );

  const lastActive = user.lastActiveAt || user.createdAt;
  let isInactive = false;
  if (lastActive) {
    isInactive = Date.now() - new Date(lastActive).getTime() > TRUST_WINDOW;
  }

  // Prompt step-up verification only if device is untrusted/inactive AND user has extra MFA setup
  const requireVerification =
    (!isDeviceTrusted || isInactive) && hasConfiguredMfa;

  const now = new Date();

  let accessToken: string | undefined;
  let refreshToken: string | undefined;

  if (!requireVerification) {
    const tokens = await issueAuthTokens({
      user,
      deviceId: deviceIdString,
      sessionId: uuidv4(),
      userAgent,
      ipAddress,
      authTokens,
    });
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    user.lastActiveAt = now;
  }

  await user.save();

  let verificationMethods: VerificationMethod[] = [];
  if (hasConfiguredMfa) {
    if (user.totpAuth.secret) verificationMethods.push("TOTP");
    if (user.securityQuestionsId)
      verificationMethods.push("SECURITY_QUESTIONS");
  }

  await INVALIDATE_CACHE.forUser({
    userId,
    deviceToken,
    eventType: "DEVICE_TRUST_UPDATE",
  });

  const safeData = sanitizeUserResult(user, userSensitiveFields());

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.AUTH.LOGGED_IN_SUCCESSFULLY_VIA_OAUTH(provider),
    accessToken,
    refreshToken,
    deviceId: deviceIdString,
    isNewUser: false,
    requireVerification,
    verificationMethods:
      verificationMethods.length > 0 ? verificationMethods : undefined,
    verificationReason: requireVerification ? "UNTRUSTED_DEVICE" : undefined,
    payload: safeData,
  };
};
