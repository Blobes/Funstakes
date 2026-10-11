import { oauthId } from "@/envVars";
import type { IOAuthProfile } from "@repo/shared";

export interface ILinkedInUserResponse {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

/**
 * Generates LinkedIn OAuth authorization URL.
 */
export const getLinkedInAuthUrl = (redirectUri: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauthId.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

/**
 * Exchanges authorization code for an access token from LinkedIn.
 */
export const exchangeLinkedInCode = async (
  code: string,
  redirectUri: string,
): Promise<string> => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: oauthId.LINKEDIN_CLIENT_ID,
    client_secret: oauthId.LINKEDIN_CLIENT_SECRET,
    redirect_uri: redirectUri,
  });

  const response = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!response.ok) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data?.access_token) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  return data.access_token;
};

/**
 * Verifies a LinkedIn access token and fetches user profile data from OpenID userinfo API.
 */
export const verifyLinkedInToken = async (
  accessToken: string,
): Promise<IOAuthProfile> => {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const payload = (await response.json()) as ILinkedInUserResponse;

  if (!payload?.sub || !payload?.email) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  return {
    email: payload.email.toLowerCase().trim(),
    providerId: payload.sub,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    emailVerified: payload.email_verified ?? true,
  };
};
