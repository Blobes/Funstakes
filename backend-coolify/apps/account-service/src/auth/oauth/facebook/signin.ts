import { Request, Response } from "express";
import { getFacebookAuthUrl, exchangeFacebookCode } from "./config";
import { GATEWAY_URL } from "@/envVars";
import { processOAuthCallback, respondOAuthPopup } from "../helpers";

/**
 * Initiates Facebook OAuth flow by redirecting browser to Facebook sign-in.
 */
export const initiateFacebookOAuth = (req: Request, res: Response): void => {
  const redirectUri = `${GATEWAY_URL}/auth/oauth/facebook/callback`;
  const authUrl = getFacebookAuthUrl(redirectUri);
  res.redirect(authUrl);
};

/**
 * Handles callback redirect from Facebook OAuth server after user approval.
 */
export const handleFacebookOAuthCallback = async (
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
    const redirectUri = `${GATEWAY_URL}/auth/oauth/facebook/callback`;
    const accessToken = await exchangeFacebookCode(code, redirectUri);

    return await processOAuthCallback({
      req,
      res,
      provider: "FACEBOOK",
      idToken: accessToken,
    });
  } catch (error: any) {
    console.error("Facebook OAuth Callback Error:", error);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "SERVER_ERROR",
    });
  }
};
