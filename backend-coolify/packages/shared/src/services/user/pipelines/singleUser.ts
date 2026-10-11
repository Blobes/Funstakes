import { PipelineStage } from "mongoose";

export const getUserStaticData = (): PipelineStage[] => {
  return [
    // Project and Format static fields
    {
      $project: {
        password: 0,
        otpCode: 0,
        otpCodeExpiresAt: 0,
        __v: 0,
      },
    },
    {
      $addFields: {
        // We set these to false as defaults for the cached version
        isFollowing: false,
        followsMe: false,
      },
    },
  ];
};
