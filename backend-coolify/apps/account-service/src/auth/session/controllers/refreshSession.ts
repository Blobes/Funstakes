import { Response, RequestHandler, NextFunction } from "express";
import {
  getOrSetDeviceToken,
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  getClientIp,
  generateRandomIp,
} from "@repo/shared";
import { executeSessionRefresh } from "@/auth/session/services/sessionRefresher";
import { clearAuthCookies, setAuthCookies } from "@repo/security";

/**
 * Controller endpoint to handle incoming cookie refresh token validation cycles.
 */
export const refreshSession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.NO_REFRESH_TOKEN,
    });
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";
  const userIp = getClientIp(req) || generateRandomIp();

  try {
    const serviceResult = await executeSessionRefresh({
      refreshToken,
      deviceToken,
      userAgent,
      ipAddress: userIp,
    });

    if (serviceResult.status === "INVALID_SESSION") {
      clearAuthCookies(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        ...serviceResult.transInfo,
      });
    }

    if (serviceResult.status === "USER_NOT_FOUND") {
      clearAuthCookies(res);
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
      });
    }

    if (serviceResult.status === "HARDWARE_MISMATCH") {
      clearAuthCookies(res);
      return res.status(403).json({
        status: "FORBIDDEN",
        ...serviceResult.transInfo,
      });
    }

    if (serviceResult.status === "ANCHOR_ROTATED") {
      clearAuthCookies(res);
      return res.status(401).json({
        status: "UNAUTHORIZED",
        ...serviceResult.transInfo,
      });
    }

    setAuthCookies(res, { accessToken: serviceResult.accessToken }, "ACCESS");

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      accessToken: serviceResult.accessToken,
    });
  } catch (error: any) {
    clearAuthCookies(res);
    console.error("Session Refresh Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
