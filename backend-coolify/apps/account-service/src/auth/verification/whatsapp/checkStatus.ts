import { NextFunction, Request, Response } from "express";
import { MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executeWhatsappCheck } from "./executeStatus";

/**
 * Controller endpoint to handle WhatsApp registration checks.
 */
export const checkWhatsAppStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<unknown> => {
  const phoneNumber = req.params.phoneNumber as string;

  if (!phoneNumber) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.PHONE_REQUIRED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeWhatsappCheck({ phoneNumber });

    if (serviceResult.status === "CONFIG_ERROR") {
      return res.status(500).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "EXTERNAL_ERROR") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: {
          exists: false,
          phoneNumber: serviceResult.phoneNumber,
        },
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      payload: {
        exists: serviceResult.exists,
        phoneNumber: serviceResult.phoneNumber,
        waId: serviceResult.waId,
      },
    });
  } catch (error: unknown) {
    console.error("WhatsApp Check Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
