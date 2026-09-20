import { NextFunction, Request, Response } from "express";
import {
  forwardError,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
  OtpActionType,
} from "@repo/shared";
import { executeOtpVerification } from "../services/verifyCode";

const VALID_PURPOSES: OtpActionType[] = [
  "LOGIN_VERIFICATION",
  "SIGNUP_VERIFICATION",
  "IDENTIFIER_UPDATE",
  "PASSWORD_RESET",
];

/**
 * Controller endpoint to handle incoming validation requests for transactional OTP records.
 */
export const verifyMsgOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { recipient, code, purpose } = req.body as {
    recipient?: string;
    code?: string;
    purpose?: OtpActionType;
  };

  if (!recipient || !code || !purpose) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.CODE_RECIPIENT_PURPOSE_REQUIRED,
      payload: null,
    });
    return;
  }

  if (!VALID_PURPOSES.includes(purpose)) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_OTP_DISPATCH_PURPOSE,
      payload: null,
    });
    return;
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const serviceResult = await executeOtpVerification({
      recipient,
      code,
      purpose,
      deviceToken,
      userAgent,
    });

    if (serviceResult.status !== "SUCCESS") {
      const statusCode = serviceResult.status === "USER_NOT_FOUND" ? 404 : 400;

      res.status(statusCode).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: unknown) {
    console.error(`[OTP_ERROR] ${purpose}:`, error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
