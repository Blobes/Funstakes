import { NextFunction, Request, Response } from "express";
import { authenticateWithOAuth, IOauthInput } from "./service";
import {
  buildLocationFromRequest,
  forwardError,
  getClientIp,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { setAuthCookies } from "@repo/security";

/**
 * Controller endpoint to exchange validated provider credentials for platform session JWTs.
 */
export const handleOauthSpa = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const {
    provider,
    idToken,
    purpose = "LOGIN",
    identityPayload,
  } = req.body as IOauthInput;
  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "";

  const userIp = getClientIp(req);
  const location = await buildLocationFromRequest(req, userIp);

  if (!provider || !idToken || !deviceToken) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.MISSING_TOKENS,
      payload: null,
    });
  }

  try {
    const result = await authenticateWithOAuth({
      provider,
      idToken,
      deviceToken,
      userAgent,
      ipAddress: userIp,
      location,
      purpose,
      identityPayload,
    });

    const {
      transInfo,
      verificationReason,
      accessToken,
      refreshToken,
      ...restResult
    } = result;

    if (
      result.status === "MERGE_RESTRICTION" ||
      result.status === "OAUTH_CREDENTIAL_UNAVAILABLE" ||
      result.status === "OAUTH_EMAIL_REQUIRED"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...transInfo,
        payload: result.payload,
      });
    }

    if (result.status === "USER_NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        statusType: "ACCOUNT_NOT_FOUND",
        ...transInfo,
        payload: result.payload,
      });
    }

    if (result.status === "ACCOUNT_ALREADY_EXISTS") {
      return res.status(409).json({
        status: "ERROR",
        statusType: "ACCOUNT_ALREADY_EXISTS",
        ...transInfo,
        payload: result.payload,
      });
    }

    if (
      result.status === "UNSUPPORTED_OAUTH_PROVIDER" ||
      result.status === "INVALID_OAUTH_TOKEN"
    ) {
      return res.status(401).json({
        status: "ERROR",
        ...transInfo,
        payload: null,
      });
    }

    if (
      result.status === "ACCOUNT_DEACTIVATED" ||
      result.status === "ACCOUNT_SUSPENDED" ||
      result.status === "ACCOUNT_BANNED"
    ) {
      return res.status(403).json({
        status: "ERROR",
        ...transInfo,
        payload: null,
      });
    }

    if (accessToken && refreshToken) {
      setAuthCookies(res, { accessToken, refreshToken });
    }

    return res.status(200).json({
      status: "SUCCESS",
      accessToken,
      ...transInfo,
      ...restResult,
      otpReason: verificationReason,
    });
  } catch (error: any) {
    console.error("OAuth Exchange Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
