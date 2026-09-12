import { IUserDocument, PermissionName, RoleName } from "@repo/database";
import { IJwtUser, InputCheckType } from "../types/general";
import { normalizeValue } from "./hash";

export const userSensitiveFields = (): string[] => {
  return [
    "password",
    "emailHash",
    "phoneNumberHash",
    "otpCode",
    "otpCodeExpiresAt",
    "lastEmailOtpSentAt",
    "lastPhoneOtpSentAt",
    "__v",
  ];
};

export const userPrivateFields = (): string[] => {
  return [
    "email",
    "phoneNumber",
    "onboardingStep",
    "dateOfBirth",
    "pendingEmail",
    "lastEmailChangeAt",
    "isEmailVerified",
    "isPhoneVerified",
    "accountStatus",
    "address",
  ];
};

/**
 * Strips sensitive identity and security attributes from user record payloads.
 */
export const sanitizeUserResult = <T>(userData: T, fields: string[]): T => {
  if (!userData || typeof userData !== "object") return userData;

  const sensitiveKeys = new Set(fields);

  // Converts Mongoose documents or plain objects into sanitized plain objects.
  const sanitizeObject = (
    obj: Record<string, unknown>,
  ): Record<string, unknown> => {
    const isMongooseDoc =
      "toObject" in obj &&
      typeof (obj as { toObject?: unknown }).toObject === "function";

    // 1. Convert Mongoose document cleanly to a plain JavaScript object
    const plainObj: Record<string, unknown> = isMongooseDoc
      ? (
          obj as { toObject: (options?: unknown) => Record<string, unknown> }
        ).toObject({
          virtuals: true,
          getters: true,
        })
      : { ...obj };

    // 2. Safely preserve runtime attachments (e.g., additions) without pulling Mongoose internal state ($__, $isNew, _doc)
    if (isMongooseDoc) {
      if ("additions" in obj && obj.additions !== undefined) {
        plainObj.additions = obj.additions;
      }
    }

    // 3. Strip sensitive keys
    sensitiveKeys.forEach((key) => {
      delete plainObj[key];
    });

    return plainObj;
  };

  if (Array.isArray(userData)) {
    return userData.map((item) =>
      typeof item === "object" && item !== null
        ? sanitizeObject(item as Record<string, unknown>)
        : item,
    ) as unknown as T;
  }
  return sanitizeObject(userData as Record<string, unknown>) as unknown as T;
};

/**
 * Transforms a User document and session metadata into a standard JWT payload.
 */
export const toJwtUser = (
  user: IUserDocument,
  deviceId: string,
  sessionId: string,
  roles: RoleName[],
  permissions?: PermissionName[],
): IJwtUser => {
  return {
    id: user._id.toString(),
    deviceId,
    sessionId,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions,
  };
};

/**
 * Resolves the verification input check-type based on input text structure.
 */
export const detectIdentifierType = (identifier: string): InputCheckType => {
  const normalized = normalizeValue(identifier);
  if (normalized.includes("@")) return "EMAIL";
  if (/^\+?\d+$/.test(normalized.replace(/\s+/g, ""))) return "PHONE_NUMBER";
  return "USERNAME";
};
