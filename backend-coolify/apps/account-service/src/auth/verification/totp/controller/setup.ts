import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeTotpSetup, TotpActionType } from "../services/setupTotp";

interface TotpSetupRequest extends IAuthRequest {
  body: {
    actionType: TotpActionType;
    identifier?: string;
  };
}

/**
 * Controller endpoint managing MFA workflows across activation and login challenge segments.
 */
export const setupTotp = async (
  req: TotpSetupRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { actionType, identifier } = req.body;
  const userId = req.user?.id;

  try {
    const serviceResult = await executeTotpSetup({
      actionType,
      identifier,
      userId,
    });

    if (
      serviceResult.status === "MISSING_IDENTIFIER" ||
      serviceResult.status === "INVALID_IDENTIFIER"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "RESTRICTION") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("TOTP Setup Initiation Failed:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
