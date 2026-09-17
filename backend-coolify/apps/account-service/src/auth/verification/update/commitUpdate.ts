import { NextFunction, Request, Response } from "express";
import {
  forwardError,
  generateRandomIp,
  getClientIp,
  getOrSetDeviceToken,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { clearAuthCookies } from "@repo/security";
import {
  executeAccountUpdate,
  ICommitAccountUpdateInput,
} from "./executeUpdate";

/**
 * Controller endpoint to commit account changes after successful verification.
 */
export const commitAccountUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const {
    identifier,
    targetDeviceId,
    purpose,
    verificationToken,
    otpIdentifierType,
  } = req.body as ICommitAccountUpdateInput;

  const userIp = getClientIp(req) || generateRandomIp();
  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const serviceResult = await executeAccountUpdate({
      identifier,
      purpose,
      verificationToken,
      otpIdentifierType,
      targetDeviceId,
      deviceToken,
      userAgent,
      ipAddress: userIp,
    });

    if (serviceResult.status !== "SUCCESS") {
      const statusCode =
        serviceResult.status === "USER_NOT_FOUND"
          ? 404
          : serviceResult.status === "UNAUTHORIZED"
            ? 401
            : serviceResult.status === "INVALID_PURPOSE" ||
                serviceResult.status === "BAD_REQUEST"
              ? 400
              : 500;

      res.status(statusCode).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    // Handle cookie eviction if specified by result state
    if (serviceResult.payload?.clearLocalCookies) {
      clearAuthCookies(res);
      delete serviceResult.payload.clearLocalCookies;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.ACCOUNT_RECORDS_UPDATED,
      payload: serviceResult.payload || null,
    });
  } catch (error: unknown) {
    // Handling error dispatch to global handler
    const errorObj = error as { statusCode?: number; status?: number };
    const statusCode = errorObj?.statusCode || errorObj?.status || 500;
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
      statusCode,
    );
  }
};
