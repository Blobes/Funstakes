import { registerUserAccount } from "@/auth/registration/services/registerAccount";
import { setAuthCookies } from "@repo/security";
import {
  forwardError,
  generateRandomIp,
  getClientIp,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { NextFunction, Request, Response } from "express";

export interface CreateRequest extends Request {
  body: {
    email: string;
    password: string;
    phone?: string;
  };
}

/**
 * Controller endpoint for handling incoming user signup registration flows.
 */
export const createAccount = async (
  req: CreateRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { email, password, phone } = req.body;
  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";
  const clientIp = getClientIp(req) || generateRandomIp();

  if (!email || !password) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.EMAIL_PASSWORD_REQUIRED,
      payload: null,
    });
  }

  try {
    const serviceResult = await registerUserAccount({
      email,
      password,
      phone,
      deviceToken,
      ipAddress: clientIp,
      userAgent,
    });

    const isDeactivated = serviceResult.status === "DEACTIVATED";

    if (
      isDeactivated ||
      serviceResult.status === "CONFLICT_EMAIL_IN_USE" ||
      serviceResult.status === "CONFLICT_PHONE_IN_USE"
    ) {
      return res.status(409).json({
        status: isDeactivated ? "DEACTIVATED" : "ERROR",
        ...serviceResult.transInfo,
        payload: { userId: isDeactivated ? serviceResult.userId : null },
      });
    }

    if (serviceResult.accessToken && serviceResult.refreshToken) {
      setAuthCookies(res, {
        accessToken: serviceResult.accessToken,
        refreshToken: serviceResult.refreshToken,
      });
    }
    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.safeData,
      accessToken: serviceResult.accessToken,
      refreshToken: serviceResult.refreshToken,
    });
  } catch (error: any) {
    // if (error.code === 11000) {
    //   const fieldName = Object.keys(error.keyValue)[0] || "record";
    //   return res.status(409).json({
    //     status: "ERROR",
    //     ...MESSAGES_REGISTRY.AUTH.RECORD_ALREADY_EXISTS(fieldName),
    //     payload: null,
    //   });
    // }
    console.error("Registration Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
