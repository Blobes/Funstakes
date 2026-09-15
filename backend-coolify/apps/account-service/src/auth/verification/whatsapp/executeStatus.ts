import { MESSAGES_REGISTRY, TransInfo } from "@repo/shared";
import { phoneDispatchTokens } from "../../../envVars";

interface ICheckWhatsAppNumberInput {
  phoneNumber: string;
}

export interface ICheckWhatsAppNumberResult {
  status: "SUCCESS" | "CONFIG_ERROR" | "EXTERNAL_ERROR";
  transInfo?: TransInfo;
  exists: boolean;
  phoneNumber: string;
  waId?: string;
}

/**
 * Executes WhatsApp status validation against Meta Cloud API.
 */
export const executeWhatsappCheck = async (
  input: ICheckWhatsAppNumberInput,
): Promise<ICheckWhatsAppNumberResult> => {
  const { phoneNumber } = input;

  const sanitizedNumber = phoneNumber.replace(/\D/g, "");

  const url = phoneDispatchTokens.WHATSAPP_API_URL || "";
  const accessToken = phoneDispatchTokens.WHATSAPP_ACCESS_KEY;

  if (!accessToken || !url) {
    return {
      status: "CONFIG_ERROR",
      exists: false,
      phoneNumber: sanitizedNumber,
      transInfo: MESSAGES_REGISTRY.AUTH.WHATSAPP_CONFIG_FAILED,
    };
  }

  try {
    const response = await fetch(`${url}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocking: "wait",
        contacts: [`+${sanitizedNumber}`],
        force_check: true,
      }),
    });

    const data: any = await response.json();
    const errorMsg = data?.error?.message;

    if (!response.ok) {
      return {
        status: "EXTERNAL_ERROR",
        exists: false,
        phoneNumber: sanitizedNumber,
        transInfo: errorMsg
          ? MESSAGES_REGISTRY.AUTH.UNKNOWN_SERVER_ERROR(errorMsg)
          : MESSAGES_REGISTRY.AUTH.WHATSAPP_CHECK_FAILED,
      };
    }

    const contactResult = data?.contacts?.[0];
    const isValid = contactResult?.status === "valid";

    return {
      status: "SUCCESS",
      exists: isValid,
      phoneNumber: sanitizedNumber,
      waId: isValid ? contactResult?.wa_id : undefined,
    };
  } catch (error: any) {
    const errorMsg = error.message;
    return {
      status: "EXTERNAL_ERROR",
      exists: false,
      phoneNumber: sanitizedNumber,
      transInfo: errorMsg
        ? MESSAGES_REGISTRY.AUTH.UNKNOWN_SERVER_ERROR(errorMsg)
        : MESSAGES_REGISTRY.AUTH.WHATSAPP_CHECK_FAILED,
    };
  }
};
