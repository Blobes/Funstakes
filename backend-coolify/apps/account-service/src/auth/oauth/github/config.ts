import { oauthId } from "@/envVars";
import type { IOAuthProfile } from "@repo/shared";

export interface IGitHubUserResponse {
  id: number;
  login: string;
  name?: string;
  email?: string;
}

export interface IGitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string;
}

/**
 * Generates GitHub OAuth authorization URL.
 */
export const getGitHubAuthUrl = (redirectUri: string): string => {
  const params = new URLSearchParams({
    client_id: oauthId.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "user:email read:user",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Exchanges authorization code for an access token from GitHub API.
 */
export const exchangeGitHubCode = async (
  code: string,
  redirectUri: string,
): Promise<string> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: oauthId.GITHUB_CLIENT_ID,
      client_secret: oauthId.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

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
 * Verifies a GitHub access token and fetches user profile and verified email.
 */
export const verifyGitHubToken = async (
  accessToken: string,
): Promise<IOAuthProfile> => {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Express-OAuth-App",
    },
  });

  if (!userResponse.ok) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const userPayload = (await userResponse.json()) as IGitHubUserResponse;

  if (!userPayload?.id) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  let email = userPayload.email;
  let isEmailVerified = false;

  // Fallback to fetch primary verified email from GitHub email endpoint if missing on user profile
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Express-OAuth-App",
      },
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as IGitHubEmailResponse[];
      const primaryVerified = emails.find((e) => e.primary && e.verified);
      const anyVerified = emails.find((e) => e.verified);

      if (primaryVerified) {
        email = primaryVerified.email;
        isEmailVerified = true;
      } else if (anyVerified) {
        email = anyVerified.email;
        isEmailVerified = true;
      }
    }
  } else {
    isEmailVerified = true;
  }

  if (!email) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  const nameParts = (userPayload.name || "").trim().split(" ");
  const firstName = nameParts[0] || userPayload.login;
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    email: email.toLowerCase().trim(),
    providerId: String(userPayload.id),
    firstName,
    lastName,
    emailVerified: isEmailVerified,
  };
};
