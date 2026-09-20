import { authTokens, FUNSTAKES_REDIS_URL } from "@/envVars";
import { ILocation, IUserDocument, UserModel } from "@repo/database";
import {
  genVerificationCode,
  hashCode,
  userSensitiveFields,
  upsertDevice,
  enqueueOtpTask,
  MESSAGES_REGISTRY,
  TransInfo,
  sanitizeUserResult,
  normalizeValue,
  INVALIDATE_CACHE,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { executeAccountCheck } from "../../check/service";
import { encryptPass } from "../../helpers/encrypt";
import { issueAuthTokens } from "@repo/security";
import { syncDefaultRole } from "../../helpers/syncRole";

interface IRegistrationInput {
  email: string;
  password: string;
  phone?: string;
  deviceToken: string;
  ipAddress: string;
  location?: ILocation;
  userAgent: string;
}

interface IRegistrationResult {
  status:
    | "SUCCESS"
    | "DEACTIVATED"
    | "CONFLICT_EMAIL_IN_USE"
    | "CONFLICT_PHONE_IN_USE";
  transInfo?: TransInfo;
  userId?: string;
  safeData?: any;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Handles the core business logic pipeline for user account registration.
 */
export const registerUserAccount = async (
  input: IRegistrationInput,
): Promise<IRegistrationResult> => {
  const {
    email,
    password,
    phone,
    deviceToken,
    ipAddress,
    location,
    userAgent,
  } = input;
  const normalizedEmail = normalizeValue(email.toLowerCase());
  const normalizedPhone = normalizeValue(phone?.toString());

  // Validate email availability and security state using unified service check layer
  const emailCheckResult = await executeAccountCheck({
    identifierType: "EMAIL",
    identifier: normalizedEmail,
    purpose: "REGISTRATION",
  });

  if (emailCheckResult.isExisting) {
    if (emailCheckResult.payload?.accountStatus === "DEACTIVATED") {
      return {
        status: "DEACTIVATED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
        userId: emailCheckResult.payload.userId.toString(),
      };
    }
    return {
      status: "CONFLICT_EMAIL_IN_USE",
      transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_CONFLICT,
    };
  }

  // Validate phone number availability if provided during flow step
  if (normalizedPhone) {
    const phoneCheckResult = await executeAccountCheck({
      identifierType: "PHONE_NUMBER",
      identifier: normalizedPhone,
      purpose: "REGISTRATION",
    });
    if (phoneCheckResult.isExisting) {
      return {
        status: "CONFLICT_PHONE_IN_USE",
        transInfo: MESSAGES_REGISTRY.AUTH.PHONE_CONFLICT,
      };
    }
  }

  const hashedPassword = await encryptPass(password);
  const code = genVerificationCode();
  const sessionId = uuidv4();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newUser: IUserDocument = new UserModel({
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber: normalizedPhone,
      location,
      otpCode: hashCode(code),
      otpCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      lastEmailOtpSentAt: new Date(),
      lastActiveAt: new Date(),
      signedUpWith: "EMAIL",
    });

    await newUser.save({ session });

    // Provision default role and baseline subscription tier directly
    await syncDefaultRole(newUser._id, { session, skipCheck: true });

    const device = await upsertDevice({
      user: newUser,
      deviceToken,
      userAgent,
      session,
    });

    await session.commitTransaction();

    await enqueueOtpTask(
      {
        email: normalizedEmail,
        code,
        type: "EMAIL",
        userIp: ipAddress,
      },
      FUNSTAKES_REDIS_URL,
    );

    const { accessToken, refreshToken } = await issueAuthTokens({
      user: newUser,
      deviceId: device._id.toString(),
      sessionId,
      userAgent,
      ipAddress,
      authTokens,
    });

    await INVALIDATE_CACHE.forUser({
      userId: newUser._id.toString(),
      deviceToken,
      eventType: "DEVICE_TRUST_UPDATE",
    });

    const safeData = sanitizeUserResult(newUser, userSensitiveFields());

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.REGISTRATION_SUCCESSFUL,
      safeData,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
