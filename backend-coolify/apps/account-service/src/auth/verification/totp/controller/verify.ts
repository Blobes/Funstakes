import { NextFunction, Response } from "express";
import {
  executeTotpVerification,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  TotpActionType,
} from "@repo/shared";

interface VerifyTotpRequest extends IAuthRequest {
  body: {
    actionType: TotpActionType;
    token: string;
    identifier?: string;
  };
}

/**
 * Controller endpoint managing the validation of MFA tokens during both account setup and login challenge segments.
 */
export const verifyTotpCode = async (
  req: VerifyTotpRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { actionType, token, identifier } = req.body;
  const userId = req.user?.id;

  try {
    const serviceResult = await executeTotpVerification({
      actionType,
      token,
      identifier,
      userId,
    });

    if (
      serviceResult.status === "MISSING_INPUT" ||
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

    if (serviceResult.status === "INVALID_TOKEN") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    // Resolving the successful verification request and attaching the requested payload components
    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("TOTP Verification Failed:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
