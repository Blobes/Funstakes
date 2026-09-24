import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  forwardError,
  switchAccountStatus,
} from "@repo/shared";
import { AccountStatus, ChangedByType } from "@repo/database";
import { clearAuthCookies } from "@repo/security";

interface IStatusChange {
  targetId?: string;
  targetStatus: AccountStatus;
  reason?: string | null;
  suspensionExpiresAt?: string | null;
}

/**
 * Controller endpoint to modify account operational lifecycles and evaluate security impacts.
 */
export const changeAccountStatus = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const {
    targetId,
    targetStatus,
    reason = null,
    suspensionExpiresAt = null,
  } = req.body as IStatusChange;
  const authUserId = req.user?.id;
  const userRoles = req.user?.roles;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const isTargetingSelf = !targetId || targetId === authUserId;
    const targetUserId = isTargetingSelf ? authUserId : (targetId as string);

    const changedByType: ChangedByType = userRoles?.includes("ADMIN")
      ? "ADMIN"
      : "OWNER";

    if (!isTargetingSelf && !userRoles?.includes("ADMIN")) {
      return res.status(403).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
        payload: null,
      });
    }

    const serviceResult = await switchAccountStatus({
      targetUserId,
      targetStatus,
      reason,
      changedBy: authUserId,
      changedByType,
      suspensionExpiresAt: suspensionExpiresAt
        ? new Date(suspensionExpiresAt)
        : null,
    });

    if (serviceResult.status !== "SUCCESS") {
      const statusCode = serviceResult.status === "NOT_FOUND" ? 404 : 400;
      return res.status(statusCode).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      isTargetingSelf &&
      (targetStatus === "DEACTIVATED" ||
        targetStatus === "SUSPENDED" ||
        targetStatus === "BANNED")
    ) {
      clearAuthCookies(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.ACCOUNT_RECORDS_UPDATED,
      payload: null,
    });
  } catch (error: any) {
    console.error("Account Status Change Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.ACCOUNT_STATUS_FALLBACK_ERROR(targetStatus),
      error,
    );
  }
};
