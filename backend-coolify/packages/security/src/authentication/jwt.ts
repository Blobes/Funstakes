import jwt from "jsonwebtoken";
import { Response } from "express";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  IJwtUser,
  ISessionCache,
  setCache,
} from "@repo/shared";

/**
 * Generates an Access Token and embeds session/device mapping.
 */
export const signAccessJwt = (
  user: IJwtUser,
  sessionId: string,
  accessTokenSecret: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;
  const accessToken = jwt.sign(
    {
      ...user,
      id: userId,
      deviceId,
      sessionId,
    },
    accessTokenSecret,
    { expiresIn: "15m" },
  );
  return accessToken;
};

/**
 * Generates a signed Refresh JWT and registers the session metadata in Redis.
 */
export const signRefreshJwt = async (
  user: IJwtUser,
  sessionId: string,
  refreshSecret: string,
  userAgent: string,
  ipAddress: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;

  // Signing the Refresh JWT with hardware and session binding
  const refreshToken = jwt.sign(
    { id: userId, sessionId, deviceId },
    refreshSecret,
    { expiresIn: "7d" },
  );
  // Mapping the session ID to the physical hardware fingerprint in Redis
  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
  await setCache<ISessionCache>(
    sessionKey,
    {
      deviceId,
      userAgent,
      ip: ipAddress,
      lastActive: new Date(),
      createdAt: new Date(),
    },
    CACHE_EXPIRY.DAY_20,
  );
  return refreshToken;
};

export const setAuthCookies = (
  res: Response,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
  },
  authType: "ACCESS" | "REFRESH" | "BOTH" = "BOTH",
) => {
  if (tokens.accessToken && (authType === "ACCESS" || authType === "BOTH")) {
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".funstakes.net",
      path: "/",
      maxAge: 30 * 60 * 1000, // 30 mins,
    });
  }

  if (tokens.refreshToken && (authType === "REFRESH" || authType === "BOTH")) {
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".funstakes.net",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};
