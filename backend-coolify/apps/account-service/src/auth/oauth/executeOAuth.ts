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

interface IOAuthAuthInput {
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

interface IOAuthAuthResult {
  status?:
    | RestrictionStatus
    | "SUCCESS"
    | "MERGE_RESTRICTION"
    | "USER_NOT_FOUND"
    | "UNSUPPORTED_OAUTH_PROVIDER"
    | "INVALID_OAUTH_TOKEN";
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  isNewUser?: boolean;
  payload?: any;
}

/**
 * Validates third-party provider ID tokens and adaptively logs in existing users or provisions new accounts.
 */
export const authenticateWithOAuth = async (
  input: IOAuthAuthInput,
): Promise<IOAuthAuthResult> => {
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

  // Check if an account already exists for the verified email
  const checkResult = await executeAccountCheck({
    identifierType: "EMAIL",
    identifier: profile.email,
    purpose,
  });

  // --- PATH A: Account Does NOT Exist (Automatic Registration) ---
  if (!checkResult.isExisting || checkResult.status === "NOT_FOUND") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newUser: IUserDocument = new UserModel({
        email: profile.email,
        oAuthId: profile.providerId,
        signedUpWith: provider,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        isEmailVerified: true,
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
      });

      await session.commitTransaction();

      const { accessToken, refreshToken } = await issueAuthTokens({
        user: newUser,
        deviceId: device._id.toString(),
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
        isNewUser: true,
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
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Prevent conflicting OAuth provider mapping (e.g. Google user trying to sign in with Apple)
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

  // Bind OAuth provider ID if missing without altering original signedUpWith method
  if (!user.oAuthId) {
    user.oAuthId = profile.providerId;
    user.lastActiveAt = new Date();
    await user.save();
  }

  // Idempotently guarantee baseline role and entitlements
  await syncDefaultRole(user._id);

  const device = await upsertDevice({ user, deviceToken, userAgent });

  const { accessToken, refreshToken } = await issueAuthTokens({
    user,
    deviceId: device._id.toString(),
    sessionId: uuidv4(),
    userAgent,
    ipAddress,
    authTokens,
  });

  await INVALIDATE_CACHE.forUser({
    userId: user._id.toString(),
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
    isNewUser: false,
    payload: safeData,
  };
};
