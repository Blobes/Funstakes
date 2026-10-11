import { Request, Response } from "express";
import { getLinkedInAuthUrl, exchangeLinkedInCode } from "./config";
import { GATEWAY_URL } from "@/envVars";
import { processOAuthCallback, respondOAuthPopup } from "../helpers";

const redirectUri = `${GATEWAY_URL}/auth/oauth/linkedin/callback`;

/**
 * Initiates LinkedIn OAuth flow by redirecting browser to LinkedIn sign-in.
 */
export const initiateLinkedinOAuth = (req: Request, res: Response): void => {
  const authUrl = getLinkedInAuthUrl(redirectUri);
  res.redirect(authUrl);
};

/**
 * Handles callback redirect from LinkedIn OAuth server after user approval.
 */
export const handleLinkedinOAuthCallback = async (
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
    const accessToken = await exchangeLinkedInCode(code, redirectUri);
    return await processOAuthCallback({
      req,
      res,
      provider: "LINKEDIN",
      idToken: accessToken,
    });
  } catch (error: any) {
    console.error("LinkedIn OAuth Callback Error:", error);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "SERVER_ERROR",
    });
  }
};
