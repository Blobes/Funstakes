import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import {
  IUpdateBasicInfoInput,
  updateAccountBasicInfo,
} from "../services/updateBasic";

/**
 * Controller endpoint to modify core identity parameters and evaluate authorization states.
 */
export const updateBasicInfo = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authUserId = req.user?.id;
  const { displayName, about, interests, website, occupation } =
    req.body as IUpdateBasicInfoInput;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await updateAccountBasicInfo({
      authUserId,
      displayName,
      about,
      interests,
      website,
      occupation,
    });

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
      requiresIdVerification: serviceResult.isPotentialPublicFigure,
    });
  } catch (error: any) {
    console.error("Update Info Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.UPDATE_INFO_ERROR,
      error,
    );
  }
};
