import { MESSAGES_REGISTRY } from "../../../constants/msgRegistry";
import { IPhoneDispatchTokens } from "../../../types/general";
import { createDomainError } from "../../../utils/error";
import { enforceOtpRateLimit } from "../rateLimit";
import { IPhoneRecipient } from "./smsDispatch";
import { APP_INFO } from "../variables";

export type WhatsAppApiResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
} & Record<string, unknown>;

/**
 * Dispatches an OTP verification code via WhatsApp Meta Graph API.
 */
export async function dispatchWhatsAppOtp(
  recipient: IPhoneRecipient,
  dispatchConfig: IPhoneDispatchTokens,
): Promise<WhatsAppApiResponse> {
  const recipientPhone = recipient.phoneNumber.trim().replace(/^\+/, "");

  if (recipient?.userIp) {
    await enforceOtpRateLimit({
      identifier: recipientPhone,
      userIp: recipient.userIp,
    });
  }

  const WHATSAPP_TOKEN = dispatchConfig.WHATSAPP_ACCESS_KEY;
  const PHONE_NUMBER_ID = dispatchConfig.WHATSAPP_PHONE_NUMBER_ID;
  const WHATSAPP_API_URL = dispatchConfig.WHATSAPP_API_URL;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    const errInfo = MESSAGES_REGISTRY.AUTH.OTP_WHATSAPP_CONFIG_INVALID;
    throw createDomainError(errInfo.message, errInfo.i18nKey, 500);
  }

  const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: "account_creation",
        language: { code: "en_US" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: { link: APP_INFO.logoUrl },
              },
            ],
          },
          {
            type: "body",
            parameters: [{ type: "text", text: recipient.code }],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: recipient.code }],
          },
        ],
      },
    }),
  });

  const data = (await response.json()) as WhatsAppApiResponse;

  if (!response.ok) {
    const detail = data.error?.message;
    const errInfo = MESSAGES_REGISTRY.AUTH.OTP_WHATSAPP_DISPATCH_FAILED(detail);
    throw createDomainError(errInfo.message, errInfo.i18nKey, 500);
  }

  return data;
}
