import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  executeAccountDeletion,
  forwardError,
} from "@repo/shared";
import { clearAuthCookies } from "@repo/security";
import { s3Config } from "@/envVars";

interface IDeleteAccountRequestBody {
  targetId?: string;
}

/**
 * Controller endpoint to permanently purge accounts and flush active hardware contexts.
 */
export const deleteAccount = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { targetId } = req.body as IDeleteAccountRequestBody;
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

    if (!isTargetingSelf && !userRoles?.includes("ADMIN")) {
      return res.status(403).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
        payload: null,
      });
    }

    const serviceResult = await executeAccountDeletion({
      targetUserId,
      s3Config,
    });

    if (serviceResult.status !== "SUCCESS") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    // Flush active client cookies if processing self deletion
    if (isTargetingSelf) {
      clearAuthCookies(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.AUTH.ACCOUNT_DELETED_SUCCESSFULLY,
      payload: null,
    });
  } catch (error: any) {
    console.error("Account Deletion Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.ACCOUNT_DELETION_FALLBACK_ERROR,
      error,
    );
  }
};
