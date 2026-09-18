import { NextFunction, Response } from "express";
import {
  forwardError,
  generateRandomIp,
  getClientIp,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { startEmailChange } from "../services/initiateChange";

interface UserEmailRequest extends IAuthRequest {
  body: {
    newEmail: string;
    password?: string;
  };
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller endpoint to handle user profile identifier email transformation procedures.
 */
export const initiateEmailChange = async (
  req: UserEmailRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { newEmail, password } = req.body;
  const userIp = getClientIp(req) || generateRandomIp();

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!newEmail || !emailRegex.test(newEmail)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_EMAIL,
      payload: null,
    });
  }

  try {
    const serviceResult = await startEmailChange({
      userId,
      newEmail,
      password,
      userIp,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
        payload: null,
      });
    }

    if (
      serviceResult.status === "PASSWORD_REQUIRED" ||
      serviceResult.status === "NO_USER_PASSWORD_SET" ||
      serviceResult.status === "EMAIL_ALREADY_USED"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "INCORRECT_PASSWORD") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "EMAIL_COOLDOWN_ACTIVE" ||
      serviceResult.status === "RATE_LIMIT_ACTIVE"
    ) {
      return res.status(429).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "EMAIL_CONFLICT") {
      return res.status(409).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Change Email Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
