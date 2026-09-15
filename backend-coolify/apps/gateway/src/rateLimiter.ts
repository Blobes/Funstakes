import { Request, Response, NextFunction } from "express";
import {
  checkSlidingWindow,
  getClientIp,
  HTTP_REQ_HEADERS,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface IAuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Middleware enforcing sliding window rate limiting based on client IP or user identity.
 */
export const rateLimiter = (limit: number, windowSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Prefer user ID for authenticated requests; fall back to IP or unknown fallback
    const authReq = req as IAuthenticatedRequest;
    const identifier = authReq.user?.id || getClientIp(req) || "unknown_client";

    try {
      const { isAllowed, currentUsage } = await checkSlidingWindow(
        identifier,
        limit,
        windowSeconds,
      );

      const remaining = Math.max(0, limit - currentUsage);

      // Standard RateLimit response headers
      res.setHeader(HTTP_REQ_HEADERS.X_RATE_LIMIT, limit);
      res.setHeader(HTTP_REQ_HEADERS.X_RATE_LIMIT_REMAINING, remaining);

      if (!isAllowed) {
        res.setHeader("Retry-After", windowSeconds);
        return res.status(429).json({
          status: "ERROR",
          ...MESSAGES_REGISTRY.GATEWAY.RATE_LIMIT_EXCEEDED(currentUsage, limit),
          payload: null,
        });
      }

      next();
    } catch (error: unknown) {
      console.error("Sliding Window Error:", error);
      next(); // Fail-open strategy
    }
  };
};
