import jwt from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import {
  CACHE_KEYS,
  getOrSetDeviceToken,
  IAuthConfig,
  IAuthRequest,
  IJwtUser,
  MESSAGES_REGISTRY,
  validateHardwareTrust,
  getCache,
  ISessionCache,
} from "@repo/shared";
import { clearAuthCookies } from "../jwt";

export const verifyAuthTokens = (config: IAuthConfig): RequestHandler => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<any> => {
    let token = req.cookies?.access_token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        ...MESSAGES_REGISTRY.AUTH.NO_AUTH_TOKEN,
        payload: null,
      });
    }

    const deviceToken = getOrSetDeviceToken(req, res);

    try {
      // ✅ Use injected secret
      const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as IJwtUser;

      const { isTrusted } = await validateHardwareTrust(
        payload.id,
        deviceToken,
        payload.deviceId,
      );

      if (!isTrusted) {
        clearAuthCookies(res);
        return res.status(401).json({
          status: "UNAUTHORIZED",
          ...MESSAGES_REGISTRY.AUTH.DEVICE_TRUST_EXPIRED,
          payload: null,
        });
      }

      const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);

      const sessionData = await getCache<ISessionCache>(sessionKey);

      if (!sessionData || sessionData.deviceId !== payload.deviceId) {
        clearAuthCookies(res);
        return res.status(401).json({
          status: "UNAUTHORIZED",
          ...MESSAGES_REGISTRY.AUTH.SESSIONS_EXPIRED,
          payload: null,
        });
      }

      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        ...MESSAGES_REGISTRY.AUTH.INVALID_TOKEN,
        payload: null,
      });
    }
  };
};

export const verifyAuthOptionally = (config: IAuthConfig): RequestHandler => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    let token = req.cookies?.access_token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ✅ Ensure device token consistency
    const deviceToken = getOrSetDeviceToken(req, res);

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as IJwtUser;

      const { isTrusted } = await validateHardwareTrust(
        payload.id,
        deviceToken,
        payload.deviceId,
      );

      if (!isTrusted) return next(); // silent fail

      const sessionKey = CACHE_KEYS.USER_SESSION(payload.id, payload.sessionId);

      const sessionData = await getCache<ISessionCache>(sessionKey);

      if (sessionData && sessionData.deviceId === payload.deviceId) {
        req.user = payload;
      }

      return next();
    } catch (err) {
      // Silent failure (expected behavior for optional auth)
      return next();
    }
  };
};
