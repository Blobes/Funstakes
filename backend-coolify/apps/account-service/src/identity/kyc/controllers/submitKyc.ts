import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeKycSubmission, ISubmitKycInput } from "../services/submit";

/**
 * Controller endpoint to submit multi-tier KYC request verification payload.
 */
export const submitKyc = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { requestType, additionalLinks, requests } =
    req.body as ISubmitKycInput;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (
    !requestType ||
    !requests ||
    (!requests.identity &&
      !requests.address &&
      !requests.finance &&
      !requests.business)
  ) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeKycSubmission({
      userId,
      requestType,
      additionalLinks,
      requests,
    });

    if (serviceResult.status === "INVALID_PAYLOAD") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "MISSING_REQUIRED_TIERS") {
      return res.status(422).json({
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

    if (serviceResult.status === "ALREADY_ACTIVE") {
      return res.status(409).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "ALREADY_PENDING") {
      return res.status(409).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(201).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Submit Verification Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
