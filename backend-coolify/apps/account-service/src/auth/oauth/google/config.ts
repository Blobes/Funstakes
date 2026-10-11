import { OAuth2Client } from "google-auth-library";
import { oauthId } from "@/envVars";
import { IOAuthProfile } from "@repo/shared";

export const googleClient = new OAuth2Client(oauthId.GOOGLE_CLIENT_ID);

/**
 * Returns a configured Google OAuth2 Client instance for server-side code exchange flows.
 */
export const getGoogleOAuthClient = (redirectUri?: string): OAuth2Client => {
  return new OAuth2Client(
    oauthId.GOOGLE_CLIENT_ID,
    oauthId.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
};

/**
 * Parses and validates a Google ID token to extract profile metadata.
 */
export const verifyGoogleToken = async (
  idToken: string,
): Promise<IOAuthProfile> => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: oauthId.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }
  return {
    email: payload.email.toLowerCase().trim(),
    providerId: payload.sub,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    emailVerified: Boolean(payload.email_verified),
  };
};
