import { Request, Response } from "express";
import { getGoogleOAuthClient } from "./config";
import { GATEWAY_URL } from "@/envVars";
import { processOAuthCallback, respondOAuthPopup } from "../helpers";

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
): Promise<any> => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "INVALID_OAUTH_CODE",
    });
  }

  try {
    const redirectUri = `${GATEWAY_URL}/auth/oauth/google/callback`;
    const oauth2Client = getGoogleOAuthClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      return respondOAuthPopup(res, {
        type: "OAUTH_ERROR",
        errorCode: "MISSING_ID_TOKEN",
      });
    }

    return await processOAuthCallback({
      req,
      res,
      provider: "GOOGLE",
      idToken: tokens.id_token,
    });
  } catch (error: any) {
    console.error("Google OAuth Callback Error:", error);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "SERVER_ERROR",
    });
  }
};
