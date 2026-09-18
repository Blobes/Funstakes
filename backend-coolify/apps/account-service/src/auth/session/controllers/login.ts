import { NextFunction, Request, Response } from "express";
import {
  getOrSetDeviceToken,
  generateRandomIp,
  MESSAGES_REGISTRY,
  forwardError,
  getClientIp,
} from "@repo/shared";
import { authenticateUser } from "@/auth/session/services/authenticate";
import { setAuthCookies } from "@repo/security";

interface LoginRequest extends Request {
  body: {
    identifier: string;
    password: string;
  };
}

/**
 * Controller endpoint to handle incoming user session login requests.
 */
export const loginUser = async (
  req: LoginRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({
      status: "ERROR",
      message: "Credential and password are required.",
      payload: null,
    });
  }

  const userAgent = req.headers["user-agent"] || "unknown";
  const userIp = getClientIp(req) || generateRandomIp();
  const deviceToken = getOrSetDeviceToken(req, res);

  try {
    const serviceResult = await authenticateUser({
      identifier,
      password,
      deviceToken,
      userAgent,
      ipAddress: userIp,
    });

    if (serviceResult.status === "USER_NOT_FOUND") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "NO_USER_PASSWORD_SET") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "THIRD_PARTY_RESTRICTION") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "ACCOUNT_DEACTIVATED" ||
      serviceResult.status === "ACCOUNT_SUSPENDED" ||
      serviceResult.status === "ACCOUNT_BANNED"
    ) {
      return res.status(403).json({
        status: serviceResult.status,
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "UNAUTHORIZED") {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        ...serviceResult.transInfo,
        payload: null,
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
      accessToken: serviceResult.accessToken,
      refreshToken: serviceResult.refreshToken,
      payload: serviceResult.payload,
      requireVerification: serviceResult.requireVerification,
      otpReason: serviceResult.verificationReason,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
