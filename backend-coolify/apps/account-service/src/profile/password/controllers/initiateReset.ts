import { NextFunction, Response } from "express";
import {
  forwardError,
  generateRandomIp,
  getClientIp,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import {
  executeResetInitiation,
  IResetInitiationInput,
} from "../services/initiateReset";

interface InitiateRequest extends IAuthRequest {
  body: IResetInitiationInput;
}

/**
 * Controller endpoint to handle user profile identifier email transformation procedures.
 */
export const initiatePasswordReset = async (
  req: InitiateRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { identifier, otpChannelType, resetMethod } = req.body;
  const userIp = getClientIp(req) || generateRandomIp();

  try {
    const serviceResult = await executeResetInitiation({
      identifier,
      otpChannelType,
      resetMethod,
      userIp,
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

    if (serviceResult.status === "RATE_LIMIT_ACTIVE") {
      return res.status(429).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Initiate Password Reset Instance Failure:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
