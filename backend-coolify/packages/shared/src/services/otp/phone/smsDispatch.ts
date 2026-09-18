import { MESSAGES_REGISTRY } from "../../../constants/msgRegistry";
import {
  AFRICAN_PHONE_CODES,
  GLOBAL_PHONE_CODES,
  ALLOWED_SMS_COUNTRIES,
} from "../../../constants/others";
import { IPhoneDispatchTokens } from "../../../types/general";
import { createDomainError } from "../../../utils/error";
import { enforceOtpRateLimit } from "../rateLimit";

export interface IPhoneRecipient {
  phoneNumber: string;
  code: string;
  userIp?: string;
}

const TIMEOUT_DUR = 45 * 1000;

/**
 * Dispatches an OTP verification SMS via Termii with a timeout constraint.
 */
async function sendLocalSms(
  { phoneNumber, code }: IPhoneRecipient,
  dispatchConfig: IPhoneDispatchTokens,
): Promise<Record<string, unknown>> {
  const apiKey = dispatchConfig.LOCAL_SMS_API_KEY;
  const senderId = dispatchConfig.LOCAL_SMS_SENDER_ID;

  if (!apiKey || !senderId) {
    const errInfo = MESSAGES_REGISTRY.AUTH.OTP_LOCAL_SMS_CONFIG_INVALID;
    throw createDomainError(errInfo.message, errInfo.i18nKey, 500);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DUR);

  try {
    const response = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: apiKey,
        to: phoneNumber.replace(/\+/g, ""),
        from: senderId,
        sms: `${code} is your verification code. Valid for 10 minutes.`,
        type: "plain",
        channel: "dnd",
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const detail = (data?.message as string) || `Status ${response.status}`;
      const errInfo =
        MESSAGES_REGISTRY.AUTH.OTP_LOCAL_SMS_DISPATCH_FAILED(detail);
      throw createDomainError(errInfo.message, errInfo.i18nKey, 500);
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      const errInfo = MESSAGES_REGISTRY.AUTH.OTP_LOCAL_SMS_TIMEOUT(TIMEOUT_DUR);
      throw createDomainError(errInfo.message, errInfo.i18nKey, 504);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Dispatches an OTP verification SMS via Telnyx for global and fallback routes.
 */
async function sendGlobalSms(
  { phoneNumber, code }: IPhoneRecipient,
  dispatchConfig: IPhoneDispatchTokens,
): Promise<Record<string, unknown>> {
  const apiKey = dispatchConfig.GLOBAL_SMS_API_KEY;
  const senderId = dispatchConfig.GLOBAL_SMS_SENDER_ID;

  if (!apiKey || !senderId) {
    const errInfo = MESSAGES_REGISTRY.AUTH.OTP_GLOBAL_SMS_CONFIG_INVALID;
    throw createDomainError(errInfo.message, errInfo.i18nKey, 500);
  }

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_profile_id: senderId,
      to: phoneNumber,
      text: `${code} is your verification code. Valid for 10 minutes.`,
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const detail = (data?.errors as Array<{ detail?: string }>)?.[0]?.detail;
    const errInfo =
      MESSAGES_REGISTRY.AUTH.OTP_GLOBAL_SMS_DISPATCH_FAILED(detail);
    throw createDomainError(errInfo.message, errInfo.i18nKey, 500);
  }

  return data;
}

/**
 * Dispatches an OTP verification code via SMS using dynamic multi-region routing.
 */
export async function dispatchSmsOtp(
  recipient: IPhoneRecipient,
  dispatchConfig: IPhoneDispatchTokens,
): Promise<Record<string, unknown>> {
  const recipientPhone = recipient.phoneNumber.trim().replace(/^\+/, "");

  if (recipient?.userIp) {
    await enforceOtpRateLimit({
      identifier: recipientPhone,
      userIp: recipient.userIp,
    });
  }

  const formattedRecipient = { ...recipient, phoneNumber: recipientPhone };

  // Strictly check if dispatching is permitted for this country code
  const isDispatchPermitted = ALLOWED_SMS_COUNTRIES.some((prefix) =>
    recipientPhone.startsWith(prefix.replace(/^\+/, "")),
  );

  if (!isDispatchPermitted) {
    const errInfo = MESSAGES_REGISTRY.AUTH.OTP_PHONE_REGION_NOT_SUPPORTED;
    throw createDomainError(errInfo.message, errInfo.i18nKey, 400);
  }

  const isAfricanPhone = AFRICAN_PHONE_CODES.some((prefix) =>
    recipientPhone.startsWith(prefix.replace(/^\+/, "")),
  );

  if (isAfricanPhone) {
    try {
      return await sendLocalSms(formattedRecipient, dispatchConfig);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        "❌ Local SMS dispatch failed or timed out → Falling back to Telnyx global route:",
        message,
      );
    }
  }

  const isAllowedGlobalPhone = GLOBAL_PHONE_CODES.some((prefix) =>
    recipientPhone.startsWith(prefix.replace(/^\+/, "")),
  );

  if (!isAllowedGlobalPhone && !isAfricanPhone) {
    const errInfo = MESSAGES_REGISTRY.AUTH.OTP_PHONE_REGION_NOT_SUPPORTED;
    throw createDomainError(errInfo.message, errInfo.i18nKey, 400);
  }

  try {
    return await sendGlobalSms(formattedRecipient, dispatchConfig);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      ("i18nKey" in err || "statusCode" in err)
    ) {
      throw err;
    }

    const rawMessage =
      err instanceof Error ? err.message : "SMS dispatch failed";
    const errorMessage = `SMS dispatch failed completely: ${rawMessage}`;

    console.error("❌ SMS dispatch failed completely:", errorMessage);

    const errInfo = MESSAGES_REGISTRY.AUTH.UNKNOWN_SERVER_ERROR(errorMessage);
    throw createDomainError(
      errInfo.message as string,
      errInfo.i18nKey as string,
      500,
    );
  }
}
