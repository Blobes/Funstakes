import crypto from "node:crypto";
import { oauthId } from "@/envVars";
import type { IOAuthProfile } from "@repo/shared";

export interface IXUserResponse {
  data: {
    id: string;
    name?: string;
    username: string;
  };
}

export interface IXAuthUrlResult {
  url: string;
  state: string;
  codeVerifier: string;
}

/**
 * PKCE code_verifier (43–128 chars, URL-safe).
 */
export const generateCodeVerifier = (): string =>
  crypto.randomBytes(32).toString("base64url");

/**
 * S256 code_challenge = BASE64URL(SHA256(verifier)).
 */
export const generateCodeChallenge = (verifier: string): string =>
  crypto.createHash("sha256").update(verifier).digest("base64url");

/**
 * Random OAuth state (CSRF).
 */
export const generateOAuthState = (): string =>
  crypto.randomBytes(16).toString("base64url");

/**
 * Builds X OAuth 2.0 authorize URL with PKCE (S256).
 * Persist `state` + `codeVerifier` (cookie/session) until the callback.
 */
export const getXAuthUrl = (redirectUri: string): IXAuthUrlResult => {
  const state = generateOAuthState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauthId.X_CLIENT_ID,
    redirect_uri: redirectUri,
    // users.read required for /2/users/me; tweet.read commonly paired
    scope: "users.read tweet.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `https://x.com/i/oauth2/authorize?${params.toString()}`,
    state,
    codeVerifier,
  };
};

/**
 * Exchanges authorization code for a user access token (confidential client + PKCE).
 */
export const exchangeXCode = async (
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<string> => {
  const credentials = Buffer.from(
    `${oauthId.X_CLIENT_ID}:${oauthId.X_CLIENT_SECRET}`,
  ).toString("base64");

  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: oauthId.X_CLIENT_ID,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  return data.access_token;
};

/**
 * Loads the authorized user profile.
 * X does not return email on /2/users/me — do not invent one.
 */
export const verifyXToken = async (
  accessToken: string,
): Promise<IOAuthProfile> => {
  const response = await fetch(
    "https://api.x.com/2/users/me?user.fields=name,username,confirmed_email", // confirmed_email only if API grants it
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) throw new Error("INVALID_OAUTH_TOKEN");

  const payload = (await response.json()) as {
    data: {
      id: string;
      name?: string;
      username: string;
      confirmed_email?: string; // often absent
    };
  };

  if (!payload?.data?.id || !payload.data.username) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const nameParts = (payload.data.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const email = payload.data.confirmed_email?.toLowerCase().trim();
  return {
    email,
    username: payload.data.username,
    providerId: payload.data.id,
    firstName: nameParts[0] || payload.data.username,
    lastName: nameParts.slice(1).join(" ") || "",
    emailVerified: Boolean(email),
  };
};
