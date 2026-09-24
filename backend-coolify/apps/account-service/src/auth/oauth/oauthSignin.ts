import { NextFunction, Request, Response } from "express";
import {
  authenticateWithOAuth,
  OAuthPurpose,
  OAuthProvider,
  IOauthInput,
} from "./executeOAuth";
import {
  buildLocationFromRequest,
  forwardError,
  getClientIp,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { setAuthCookies } from "@repo/security";
import { getGoogleOAuthClient } from "./oAuthConfig";
import { FRONTEND_URL, GATEWAY_URL } from "../../envVars";

/**
 * Controller endpoint to exchange validated provider credentials for platform session JWTs.
 */
export const oauthSpa = async (
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
  //  {
  //   provider?: OAuthProvider;
  //   idToken?: string;
  //   purpose?: OAuthPurpose;
  //   identityPayload?: { firstName?: string; lastName?: string };
  // };
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

    if (result.status === "MERGE_RESTRICTION") {
      return res.status(400).json({
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

/**
 * Initiates full page Google OAuth flow by redirecting the browser directly to Google sign-in.
 */
export const initiateGoogleOAuth = (req: Request, res: Response): void => {
  const redirectUri = `${GATEWAY_URL}/auth/oauth/google/callback`;
  const oauth2Client = getGoogleOAuthClient(redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "select_account",
  });

  res.redirect(authUrl);
};

/**
 * Handles callback redirect from Google OAuth server after full page sign in.
 */
export const handleGoogleOAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { code } = req.query;
  const frontendUrl = FRONTEND_URL || "http://localhost:3000";

  if (!code || typeof code !== "string") {
    return res.redirect(`${frontendUrl}/login?error=INVALID_OAUTH_CODE`);
  }

  try {
    const redirectUri = `${GATEWAY_URL}/auth/oauth/google/callback`;
    const oauth2Client = getGoogleOAuthClient(redirectUri);

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      return res.redirect(`${frontendUrl}/login?error=MISSING_ID_TOKEN`);
    }

    const deviceToken = getOrSetDeviceToken(req, res);
    const userAgent = req.headers["user-agent"] || "";
    const userIp = getClientIp(req);
    const location = await buildLocationFromRequest(req, userIp);

    const result = await authenticateWithOAuth({
      provider: "GOOGLE",
      idToken: tokens.id_token,
      deviceToken,
      userAgent,
      ipAddress: userIp,
      location,
      purpose: "LOGIN",
    });

    if (
      result.status !== "SUCCESS" ||
      !result.accessToken ||
      !result.refreshToken
    ) {
      return res.redirect(`${frontendUrl}/login?error=${result.status}`);
    }

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    const redirectPath = result.isNewUser ? "/onboarding" : "/";
    return res.redirect(`${frontendUrl}${redirectPath}`);
  } catch (error: any) {
    console.error("Google OAuth Callback Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
