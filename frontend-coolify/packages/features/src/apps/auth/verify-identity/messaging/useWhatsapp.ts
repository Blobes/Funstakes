"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AUTH_FEEDBACK } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { VerifyIdentityService } from "../services";

interface CheckStatusInput {
  phoneNumber?: string;
}

/**
 * Manages WhatsApp status validation and user feedback states.
 */
export const useWhatsAppStatus = ({ phoneNumber }: CheckStatusInput) => {
  const { translateTxtString } = useStaticTranslation();
  const { checkWhatsappStatus } = VerifyIdentityService();

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isWhatsappActive, setIsWhatsappActive] = useState<boolean>(false);

  /**
   * Executes validation call against API endpoint.
   */
  const { mutateAsync: executeStatusCheck, isPending: isCheckingWhatsapp } =
    useMutation({
      mutationFn: async (targetPhone: string) => {
        setStatusMsg(null);
        return await checkWhatsappStatus(targetPhone);
      },
      onSuccess: (response) => {
        if (response?.status === "ERROR") {
          setIsWhatsappActive(false);
          setStatusMsg(
            translateTxtString(AUTH_FEEDBACK.whatsapp_status_check_failed),
          );
          return;
        }

        const registered = Boolean(response?.payload?.exists);
        setIsWhatsappActive(registered);

        if (!registered) {
          setStatusMsg(
            translateTxtString(AUTH_FEEDBACK.whatsapp_not_registered),
          );
        }
      },
      onError: () => {
        setIsWhatsappActive(false);
        setStatusMsg(
          translateTxtString(AUTH_FEEDBACK.whatsapp_status_check_failed),
        );
      },
    });

  /**
   * Validates if WhatsApp is registered for the target phone number before execution.
   */
  const validateStatus = useCallback(
    async (overridePhone?: string): Promise<boolean> => {
      const activePhone = overridePhone || phoneNumber;
      if (!activePhone) {
        setStatusMsg(translateTxtString(AUTH_FEEDBACK.whatsapp_not_registered));
        return false;
      }

      try {
        const response = await executeStatusCheck(activePhone);
        return Boolean(
          response?.status !== "ERROR" && response?.payload?.exists,
        );
      } catch {
        return false;
      }
    },
    [phoneNumber, executeStatusCheck, translateTxtString],
  );

  return {
    isWhatsappActive,
    isCheckingWhatsapp,
    validateStatus,
    statusMsg,
    setStatusMsg,
  };
};
