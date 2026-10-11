import { FRONTEND_URL } from "@/envVars";
import { Request, Response } from "express";
import {
  buildLocationFromRequest,
  getClientIp,
  getOrSetDeviceToken,
} from "@repo/shared";
import { setAuthCookies } from "@repo/security";
import { authenticateWithOAuth, OAuthPurpose } from "./service";
import { OAuthProvider } from "@repo/database";

export interface IProcessOAuthAuthOptions {
  req: Request;
  res: Response;
  provider: OAuthProvider;
  idToken: string;
  purpose?: OAuthPurpose;
  identityPayload?: {
    firstName?: string;
    lastName?: string;
  };
}

const getFrontendOrigin = (): string => {
  const frontendUrl = FRONTEND_URL || "http://localhost:3000";
  try {
    return new URL(frontendUrl).origin;
  } catch {
    return frontendUrl;
  }
};

/**
 * HTML bridge for OAuth popup: notify opener, then close.
 */
export const respondOAuthPopup = (
  res: Response,
  payload: Record<string, unknown>,
): void => {
  const frontendOrigin = getFrontendOrigin();
  const body = { source: "funstakes-oauth", ...payload };
  const serialized = JSON.stringify(body).replace(/</g, "\\u003c");

  res.status(200).type("html").send(`<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Signing in…</title></head>
  <body>
    <p>Signing you in…</p>
    <script>
      (function () {
        var payload = ${serialized};
        var targetOrigin = ${JSON.stringify(frontendOrigin)};
        var sent = false;
        function notify() {
          if (sent) return;
          try {
            if (window.opener && !window.opener.closed) {
              // Exact app origin first
              window.opener.postMessage(payload, targetOrigin);
              // Fallback if opener is on www / another allowed host
            //  window.opener.postMessage(payload, "*");
              sent = true;
            }
          } catch (e) {}
        }
        notify();
        // Give opener time to handle before closing
        setTimeout(function () {
          notify();
          window.close();
        }, 300);
      })();
    </script>
  </body>
</html>`);
};

/**
 * Handles common OAuth token processing, session cookie setup, and popup responses.
 */
export const processOAuthCallback = async ({
  req,
  res,
  provider,
  idToken,
  purpose = "LOGIN",
  identityPayload,
}: IProcessOAuthAuthOptions): Promise<any> => {
  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "";
  const userIp = getClientIp(req);
  const location = await buildLocationFromRequest(req, userIp);

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
    result.status === "OAUTH_CREDENTIAL_UNAVAILABLE" ||
    result.status === "OAUTH_EMAIL_REQUIRED"
  ) {
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: result.status,
      provider,
      email: result.payload?.email,
      username: result.payload?.username,
    });
  }

  if (result.status === "USER_NOT_FOUND") {
    return respondOAuthPopup(res, {
      type: "OAUTH_ACCOUNT_NOT_FOUND",
      provider,
      idToken,
      email: result.payload?.email,
      username: result.payload?.username,
    });
  }

  if (result.status === "ACCOUNT_ALREADY_EXISTS") {
    return respondOAuthPopup(res, {
      type: "OAUTH_ACCOUNT_EXISTS",
      provider,
      idToken,
      email: result.payload?.email,
    });
  }

  if (
    result.status !== "SUCCESS" ||
    !result.accessToken ||
    !result.refreshToken
  ) {
    return respondOAuthPopup(res, {
      type: "OAUTH_ERROR",
      errorCode: result.status || "SERVER_ERROR",
    });
  }

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return respondOAuthPopup(res, {
    type: "OAUTH_SESSION_SUCCESS",
    provider,
    isNewUser: Boolean(result.isNewUser),
    requireVerification: Boolean(result.requireVerification),
    redirectPath: result.isNewUser ? "/onboarding" : "/",
  });
};
