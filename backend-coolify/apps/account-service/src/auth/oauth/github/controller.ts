import { Request, Response } from "express";
import { getGitHubAuthUrl, exchangeGitHubCode } from "./config";
import { GATEWAY_URL } from "@/envVars";
import { processOAuthCallback, respondOAuthPopup } from "../helpers";

/**
 * Initiates GitHub OAuth flow by redirecting browser to GitHub sign-in.
 */
export const initiateGitHubOAuth = (req: Request, res: Response): void => {
  const redirectUri = `${GATEWAY_URL}/auth/oauth/github/callback`;
  const authUrl = getGitHubAuthUrl(redirectUri);
  res.redirect(authUrl);
};

/**
 * Handles callback redirect from GitHub OAuth server after user approval.
 */
export const handleGitHubOAuthCallback = async (
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
    const redirectUri = `${GATEWAY_URL}/auth/oauth/github/callback`;
    const accessToken = await exchangeGitHubCode(code, redirectUri);

    return await processOAuthCallback({
      req,
      res,
      provider: "GITHUB",
      idToken: accessToken,
    });
  } catch (error: any) {
    console.error("GitHub OAuth Callback Error:", error);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "SERVER_ERROR",
    });
  }
};
