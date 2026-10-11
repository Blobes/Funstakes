import { Request, Response } from "express";
import { getXAuthUrl, exchangeXCode } from "./config";
import { GATEWAY_URL } from "@/envVars";
import { processOAuthCallback, respondOAuthPopup } from "../helpers";

/**
 * Initiates X OAuth flow by redirecting browser to X sign-in.
 */
export const initiateXOAuth = (req: Request, res: Response): void => {
  const redirectUri = `${GATEWAY_URL}/auth/oauth/x/callback`;
  const { url, state, codeVerifier } = getXAuthUrl(redirectUri);
  res.cookie("x_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600_000,
  });
  res.cookie("x_oauth_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600_000,
  });
  res.redirect(url);
};

const clearOAuthCookies = (res: Response) => {
  const opts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/", // must match how they were set (default is "/")
  };
  res.clearCookie("x_oauth_state", opts);
  res.clearCookie("x_oauth_verifier", opts);
};

/**
 * Handles callback redirect from X OAuth server after user approval.
 */
export const handleXOAuthCallback = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const code = req.query.code;
  const state = req.query.state;
  const savedState = req.cookies?.x_oauth_state;
  const codeVerifier = req.cookies?.x_oauth_verifier;

  if (
    !code ||
    typeof code !== "string" ||
    !state ||
    state !== savedState ||
    !codeVerifier
  ) {
    clearOAuthCookies(res);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "INVALID_OAUTH_CODE",
    });
  }

  try {
    const redirectUri = `${GATEWAY_URL}/auth/oauth/x/callback`;
    const accessToken = await exchangeXCode(code, redirectUri, codeVerifier);
    clearOAuthCookies(res);
    return await processOAuthCallback({
      req,
      res,
      provider: "X",
      idToken: accessToken,
    });
  } catch (error: any) {
    console.error("X OAuth Callback Error:", error);
    clearOAuthCookies(res);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "SERVER_ERROR",
    });
  }
};
