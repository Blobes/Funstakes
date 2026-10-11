import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { oauthId } from "../../../envVars";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";

/**
 * Parses and verifies the signed_request payload sent by Facebook.
 */
function parseSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, payload] = signedRequest.split(".", 2);

  const sig = Buffer.from(
    encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );
  const data = JSON.parse(
    Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf-8"),
  );
  // Confirm hash algorithm
  if (!data.algorithm || data.algorithm.toUpperCase() !== "HMAC-SHA256") {
    return null;
  }
  // Validate signature
  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    return null;
  }
  return data;
}

/**
 * Handles Facebook deauthorization callback webhooks.
 */
export async function handleFacebookDeauthorize(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const signedRequest = req.body?.signed_request;
    const appSecret = oauthId.FACEBOOK_CLIENT_SECRET;

    if (!signedRequest || !appSecret) {
      return res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.FACEBOOK_DEAUTHORIZE_FAILED,
      });
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.FACEBOOK_INVALID_SIGNATURE,
      });
    }

    const facebookUserId = data.user_id;

    // Unlink Facebook ID or mark account as disconnected in DB
    // await User.updateOne({ facebookId: facebookUserId }, { $unset: { facebookId: 1 } });

    // Respond to Meta with a success confirmation payload
    return res.status(200).json({
      status: "SUCCESS",
      url: "https://funstakes.net/deauthorize-confirmation",
      confirmation_code: facebookUserId,
    });
  } catch (error: any) {
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.FACEBOOK_DEAUTHORIZE_SERVER_ERROR,
      error,
    );
  }
}
