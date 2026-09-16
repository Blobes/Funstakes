import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, validateAccountStatus } from "@repo/shared";
import { clearAuthCookies } from "../jwt";

/**
 * Validates active account status and blocks restricted users.
 */
export const checkAccountRestriction: RequestHandler = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): any => {
  const accountStatus = req.user?.accountStatus;
  const { isRestricted, status, transInfo } = validateAccountStatus({
    accountStatus,
    mode: "RESTRICTED",
  });

  if (isRestricted) {
    clearAuthCookies(res);
    return res.status(401).json({
      status,
      ...transInfo,
      payload: null,
    });
  }

  next();
};
