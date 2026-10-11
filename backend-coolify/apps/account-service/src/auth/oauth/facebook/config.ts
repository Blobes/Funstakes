import { oauthId } from "@/envVars";
import type { IOAuthProfile } from "@repo/shared";

export interface IFacebookUserResponse {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Generates Facebook OAuth authorization URL.
 */
export const getFacebookAuthUrl = (redirectUri: string): string => {
  const params = new URLSearchParams({
    client_id: oauthId.FACEBOOK_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "email,public_profile",
    response_type: "code",
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
};

/**
 * Exchanges authorization code for an access token from Facebook Graph API.
 */
export const exchangeFacebookCode = async (
  code: string,
  redirectUri: string,
): Promise<string> => {
  const params = new URLSearchParams({
    client_id: oauthId.FACEBOOK_CLIENT_ID,
    client_secret: oauthId.FACEBOOK_CLIENT_SECRET,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`,
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
 * Verifies a Facebook access token and fetches user profile data from Graph API.
 */
export const verifyFacebookToken = async (
  accessToken: string,
): Promise<IOAuthProfile> => {
  const params = new URLSearchParams({
    fields: "id,email,first_name,last_name",
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const payload = (await response.json()) as IFacebookUserResponse;

  if (!payload?.id || !payload?.email) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  return {
    email: payload.email.toLowerCase().trim(),
    providerId: payload.id,
    firstName: payload.first_name || "",
    lastName: payload.last_name || "",
    emailVerified: true,
  };
};
