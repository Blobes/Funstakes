import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { oauthId } from "@/envVars";
import { IOAuthProfile } from "@repo/shared";

/**
 * Initializes the remote JSON Web Key Set client to retrieve Apple public signing keys dynamically.
 */
const appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000,
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
    jwt.verify(
      idToken,
      getAppleSigningKey,
      {
        issuer: "https://appleid.apple.com",
        audience: oauthId.APPLE_CLIENT_ID,
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
          providerId: jwtClaims.sub!,
          emailVerified:
            jwtClaims.email_verified === true ||
            jwtClaims.email_verified === "true",
        });
      },
    );
  });
};

/**
 * Builds Apple authorize URL for server redirect (popup) flow.
 */
export const getAppleAuthorizeUrl = (
  redirectUri: string,
  state?: string,
): string => {
  const params = new URLSearchParams({
    client_id: oauthId.APPLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "form_post", // Apple often POSTs the callback
    scope: "name email",
    ...(state ? { state } : {}),
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
};

/**
 * Exchanges Apple authorization code for tokens (includes id_token).
 */
export const exchangeAppleCode = async (
  code: string,
  redirectUri: string,
): Promise<{ id_token?: string }> => {
  const body = new URLSearchParams({
    client_id: oauthId.APPLE_CLIENT_ID,
    client_secret: oauthId.APPLE_CLIENT_SECRET, // JWT client secret
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("INVALID_OAUTH_TOKEN");
  }

  return (await response.json()) as { id_token?: string };
};
