import { NextFunction, Request, Response } from "express";
import {
  forwardError,
  getClientIp,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
  OtpMessageChannel,
} from "@repo/shared";
import { executeOtpDispatch } from "../services/dipatchCode";

/**
 * Controller endpoint to handle verification code requests.
 */
export const sendMsgCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { recipient, messageChannel } = req.body as {
    recipient?: string;
    messageChannel?: OtpMessageChannel;
  };

  if (!recipient) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
      payload: null,
    });
    return;
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";
  const clientIp = getClientIp(req) || "unknown_client";

  try {
    const serviceResult = await executeOtpDispatch({
      recipient,
      userAgent,
      deviceToken,
      userIp: clientIp,
      messageChannel: messageChannel,
    });

    if (serviceResult.status !== "SUCCESS") {
      const errorCode =
        serviceResult.status === "USER_NOT_FOUND"
          ? 404
          : serviceResult.status === "COOLDOWN_ACTIVE"
            ? 429
            : 400;

      res.status(errorCode).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
        retryAfter: serviceResult.retryAfter,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: unknown) {
    console.error("[sendCode] Error:", error);
    // const errorObj = error as { statusCode?: number; status?: number };
    // const statusCode = errorObj?.statusCode || errorObj?.status || 500;
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
      // statusCode,
    );
  }
};
