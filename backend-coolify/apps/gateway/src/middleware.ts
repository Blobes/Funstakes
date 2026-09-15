import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { HTTP_REQ_HEADERS, IAuthRequest, IJwtUser } from "@repo/shared";

/**
 * Gateway-level identity forwarding middleware.
 * Decodes JWTs when present to inject identity headers for downstream microservices without blocking unauthenticated requests.
 */
export const forwardIdHeaders = (jwtSecret: string) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.access_token ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) return next();

    try {
      const decoded = jwt.verify(token, jwtSecret) as IJwtUser;
      req.user = decoded;

      // Attach stateless identity claims for downstream microservices
      req.headers[HTTP_REQ_HEADERS.USER_ID] = String(decoded.id);
      req.headers[HTTP_REQ_HEADERS.USER_EMAIL] = decoded.email || "";
      req.headers[HTTP_REQ_HEADERS.USER_ROLES] = JSON.stringify(
        decoded.roles || [],
      );

      // Forward subscription claims to downstream services
      // Forward subscription claims to downstream services
      req.headers[HTTP_REQ_HEADERS.SUBSCRIPTION_TIER] =
        decoded.subscriptionTier || "FREE";
      req.headers[HTTP_REQ_HEADERS.SUBSCRIPTION_STATUS] =
        decoded.subscriptionStatus || "ACTIVE";

      if (decoded.deviceId) {
        req.headers[HTTP_REQ_HEADERS.DEVICE_ID] = decoded.deviceId;
      }
      if (decoded.sessionId) {
        req.headers[HTTP_REQ_HEADERS.SESSION_ID] = decoded.sessionId;
      }
    } catch {
      // Allow request to proceed unauthenticated if token verification fails; downstream services will handle strict enforcement
    }
    next();
  };
};
