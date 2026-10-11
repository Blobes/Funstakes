import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeKycReview, IReviewKycInput } from "../services/review";

/**
 * Controller endpoint to process administrative review decisions on a KYC tier subdocument.
 */
export const reviewKyc = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const adminId = req.user?.id;
  const { requestId, requestType, subdocumentId, decision, rejectionReason } =
    req.body as IReviewKycInput;

  if (!adminId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!requestId || !requestType || !subdocumentId || !decision) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeKycReview({
      requestId,
      requestType,
      subdocumentId,
      decision,
      adminId,
      rejectionReason,
    });

    if (serviceResult.status === "INVALID_PAYLOAD") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "REJECTED_REASON_REQUIRED") {
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

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Review Verification Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
