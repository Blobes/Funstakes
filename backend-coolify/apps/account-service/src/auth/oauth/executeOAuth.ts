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
} from "./oAuthClients";
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
  purpose: OAuthPurpose;
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
    | "EMAIL_NOT_FOUND"
    | "USER_NOT_FOUND"
    | "CONFLICT_EMAIL_IN_USE"
    | "UNSUPPORTED_OAUTH_PROVIDER"
    | "INVALID_OAUTH_TOKEN";
  transInfo?: TransInfo;
  accessToken?: string;
  refreshToken?: string;
  payload?: any;
}

/**
 * Validates third-party provider ID tokens and routes requests via explicit purpose-driven registration or login pipelines.
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

  // Single unified try-catch block handling token verification for all supported providers
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

  // Routing identifier checking logic through primary check layer
  const checkResult = await executeAccountCheck({
    identifierType: "EMAIL",
    identifier: profile.email,
    purpose,
  });
  const accountStatus = checkResult.payload?.accountStatus;

  // --- Registration purpose pipeline ---
  if (purpose === "REGISTRATION") {
    if (checkResult.isExisting) {
      const { isRestricted, status, transInfo } = validateAccountStatus({
        accountStatus: accountStatus,
        mode: "RESTRICTED",
      });
      if (isRestricted) {
        return { status, transInfo };
      }

      return {
        status: "CONFLICT_EMAIL_IN_USE",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_ALREADY_REGISTERED,
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
        payload: safeData,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- Login purpose pipeline ---
  if (checkResult.status === "NOT_FOUND") {
    return {
      status: "EMAIL_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_NOT_FOUND,
    };
  }

  const { isRestricted, status, transInfo } = validateAccountStatus({
    accountStatus: accountStatus,
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

  // Enforcing third-party mapping restriction checks based on registration origin
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

  // Binding the generic identity identifier if missing, leaving signedUpWith unaltered
  if (!user.oAuthId) {
    user.oAuthId = profile.providerId;
    user.lastActiveAt = new Date();
    await user.save();
  }

  // Idempotently guarantee baseline role and subscription for existing account login
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

  INVALIDATE_CACHE.forUser({
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
    payload: safeData,
  };
};
