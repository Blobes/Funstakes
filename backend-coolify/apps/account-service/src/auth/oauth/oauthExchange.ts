import { NextFunction, Request, Response } from "express";
import {
  authenticateWithOAuth,
  OAuthPurpose,
  OAuthProvider,
} from "./executeOAuth";
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
export const oauthExchange = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const {
    provider,
    idToken,
    purpose = "LOGIN",
    identityPayload,
  } = req.body as {
    provider?: OAuthProvider;
    idToken?: string;
    purpose?: OAuthPurpose;
    identityPayload?: { firstName?: string; lastName?: string };
  };
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

    if (
      result.status === "UNSUPPORTED_OAUTH_PROVIDER" ||
      result.status === "INVALID_OAUTH_TOKEN"
    ) {
      return res.status(401).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (
      result.status === "EMAIL_NOT_FOUND" ||
      result.status === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (result.status === "CONFLICT_EMAIL_IN_USE") {
      return res.status(409).json({
        status: "ERROR",
        ...result.transInfo,
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
        ...result.transInfo,
        payload: null,
      });
    }

    if (result.status === "MERGE_RESTRICTION") {
      return res.status(400).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...result.transInfo,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      payload: result.payload,
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
