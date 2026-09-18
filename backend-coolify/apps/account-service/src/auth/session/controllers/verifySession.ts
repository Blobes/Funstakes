import { Response, RequestHandler, NextFunction } from "express";
import {
  buildLocationFromRequest,
  forwardError,
  generateRandomIp,
  getClientIp,
  getOrSetDeviceToken,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { executeSessionVerification } from "@/auth/session/services/sessionVerifier";
import { clearAuthCookies } from "@repo/security";

/**
 * Controller endpoint to handle session integrity checks and state verification.
 */
export const verifySession: RequestHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const sessionId = req.user?.sessionId;
  const jwtDeviceId = req.user?.deviceId;

  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";

  const userIp = getClientIp(req) || generateRandomIp();
  const location = await buildLocationFromRequest(req, userIp);

  try {
    const serviceResult = await executeSessionVerification({
      userId,
      sessionId,
      jwtDeviceId,
      deviceToken,
      userAgent,
      location,
    });

    if (serviceResult.status === "CONTEXT_MISSING") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "TRUST_EXPIRED" ||
      serviceResult.status === "USER_NOT_FOUND" ||
      serviceResult.status === "SESSION_MISMATCH" ||
      serviceResult.status === "ANCHOR_ROTATED"
    ) {
      clearAuthCookies(res);
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "HARDWARE_MISMATCH") {
      clearAuthCookies(res);
      return res.status(403).json({
        status: "FORBIDDEN",
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
    console.error("Session Verification Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
