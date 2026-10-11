import { Request, Response } from "express";
import { exchangeAppleCode, getAppleAuthorizeUrl } from "./config";
import { GATEWAY_URL } from "../../../envVars";
import { processOAuthCallback, respondOAuthPopup } from "../helpers";

/**
 * Initiates Apple OAuth inside the browser popup.
 */
export const initiateAppleOAuth = (_req: Request, res: Response): void => {
  const redirectUri = `${GATEWAY_URL}/auth/oauth/apple/callback`;
  const authUrl = getAppleAuthorizeUrl(redirectUri);
  res.redirect(authUrl);
};

/**
 * Apple OAuth callback (GET or POST — Apple often uses form_post).
 */
export const handleAppleOAuthCallback = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const code =
    (typeof req.body?.code === "string" && req.body.code) ||
    (typeof req.query?.code === "string" && req.query.code) ||
    null;

  const firstName =
    req.body?.user && typeof req.body.user === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(req.body.user);
            return parsed?.name?.firstName as string | undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined;

  const lastName =
    req.body?.user && typeof req.body.user === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(req.body.user);
            return parsed?.name?.lastName as string | undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined;

  if (!code) {
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "INVALID_OAUTH_CODE",
    });
  }

  try {
    const redirectUri = `${GATEWAY_URL}/auth/oauth/apple/callback`;
    const tokens = await exchangeAppleCode(code, redirectUri);

    if (!tokens.id_token) {
      return respondOAuthPopup(res, {
        type: "OAUTH_ERROR",
        errorCode: "MISSING_ID_TOKEN",
      });
    }

    return await processOAuthCallback({
      req,
      res,
      provider: "APPLE",
      idToken: tokens.id_token,
      identityPayload:
        firstName || lastName ? { firstName, lastName } : undefined,
    });
  } catch (error: any) {
    console.error("Apple OAuth Callback Error:", error);
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: "SERVER_ERROR",
    });
  }
};
