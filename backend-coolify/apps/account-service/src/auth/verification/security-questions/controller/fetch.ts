import { NextFunction, Request, Response } from "express";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";
import { executeFetchSecurityQuestions } from "../services/fetch";

/**
 * Controller endpoint managing retrieval of configured MFA security questions.
 */
export const fetchSecurityQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const identifier = req.params.identifier as string;

  try {
    const serviceResult = await executeFetchSecurityQuestions({
      identifier,
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

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: unknown) {
    console.error("Fetch Security Questions Failed:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
