import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import jwksClient from "jwks-rsa";
import { oauthId } from "@/envVars";

export interface IOAuthProfile {
  email: string;
  providerId: string;
  firstName?: string;
  lastName?: string;
}

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
  };
};

/**
 * Initializes the remote JSON Web Key Set client to retrieve Apple public signing keys dynamically.
 */
const appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // Cache public keys for 10 minutes
});

/**
 * Retrieves the specific public signing key associated with the token header key ID.
 */
const getAppleSigningKey = (
  header: JwtHeader,
  callback: SigningKeyCallback,
): void => {
  if (!header.kid) {
    return callback(new Error("Missing key ID from token header."));
  }
  appleJwksClient.getSigningKey(header.kid, (err: any, key: any) => {
    if (err || !key) {
      return callback(err || new Error("Apple public signing key not found."));
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Parses and validates an Apple identity token to extract profile metadata.
 */
export const verifyAppleToken = async (
  idToken: string,
): Promise<IOAuthProfile> => {
  return new Promise((resolve, reject) => {
    // Decode and verify signature, issuer, and target client application audience constraints
    jwt.verify(
      idToken,
      getAppleSigningKey,
      {
        issuer: "https://appleid.apple.com",
        audience: oauthId.APPLE_CLIENT_ID, // Your Apple Service ID / Bundle ID
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err || !decoded || typeof decoded === "string") {
          return reject(new Error("INVALID_OAUTH_TOKEN"));
        }

        const jwtClaims = decoded as jwt.JwtPayload;

        if (!jwtClaims.email) {
          return reject(new Error("INVALID_OAUTH_TOKEN"));
        }

        resolve({
          email: jwtClaims.email.toLowerCase().trim(),
          providerId: jwtClaims.sub!, // The permanent unique user identifier from Apple
        });
      },
    );
  });
};
