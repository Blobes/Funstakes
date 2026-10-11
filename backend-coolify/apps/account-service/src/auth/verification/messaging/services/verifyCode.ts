import { DEVICE_NESTED_FIELDS, DeviceModel } from "@repo/database";
import {
  ensurePrimaryDevice,
  fetchSingleUser,
  getOtpIdentifierType,
  hashCode,
  MESSAGES_REGISTRY,
  OtpActionType,
  OtpIdentifierType,
  TransInfo,
} from "@repo/shared";
import { signOtpActionToken } from "./verificationToken";

interface IVerifyOtpInput {
  recipient: string;
  code: string;
  purpose: OtpActionType;
  deviceToken: string;
  userAgent: string;
}

interface IVerifyOtpResult {
  status:
    | "SUCCESS"
    | "EXPIRED_CODE"
    | "INVALID_CODE"
    | "USER_NOT_FOUND"
    | "INVALID_CHANNEL";
  transInfo?: TransInfo;
  payload?: {
    identifier?: string;
    verificationToken: string;
    purpose: OtpActionType;
    otpIdentifierType: OtpIdentifierType;
  };
}

/**
 * Validates OTP code entries and issues short-lived single-use action verification tokens.
 */
export const executeOtpVerification = async (
  input: IVerifyOtpInput,
): Promise<IVerifyOtpResult> => {
  const { recipient, code, purpose, deviceToken } = input;
  const normalized = recipient.toLowerCase().trim();
  const otpIdentifierType = getOtpIdentifierType(normalized);

  if (!otpIdentifierType) {
    return {
      status: "INVALID_CHANNEL",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CHANNEL,
    };
  }

  const user = await fetchSingleUser({
    identifier: normalized,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (
    !user.otpCode ||
    !user.otpCodeExpiresAt ||
    Date.now() > user.otpCodeExpiresAt.getTime()
  ) {
    return {
      status: "EXPIRED_CODE",
      transInfo: MESSAGES_REGISTRY.AUTH.CODE_EXPIRED,
    };
  }

  if (hashCode(code) !== user.otpCode) {
    return {
      status: "INVALID_CODE",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_OTP_CODE,
    };
  }

  const currentDevice = deviceToken
    ? await DeviceModel.findOne({
        deviceToken,
        [DEVICE_NESTED_FIELDS.USERS_USER_ID]: user._id,
      }).select("_id")
    : null;

  await ensurePrimaryDevice(user, currentDevice?._id?.toString());

  user.otpCode = null;
  user.otpCodeExpiresAt = null;
  await user.save();

  const verificationToken = signOtpActionToken({
    userId: String(user._id),
    purpose,
    recipient: normalized,
    otpIdentifierType,
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.OTP_VERIFIED_SUCCESSFULLY,
    payload: {
      identifier: String(user._id),
      verificationToken,
      purpose,
      otpIdentifierType,
    },
  };
};
