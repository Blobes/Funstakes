import mongoose, { PipelineStage } from "mongoose";

export const postStaticLookup = (): PipelineStage[] => {
  return [
    // Author Lookup
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              username: 1,
              displayName: 1,
              profileImage: 1,
            },
          },
        ],
        as: "authorDetails",
      },
    },
    { $unwind: { path: "$authorDetails", preserveNullAndEmptyArrays: true } },

    // Media Lookup
    {
      $lookup: {
        from: "media",
        localField: "_id",
        foreignField: "sourceId",
        as: "media",
      },
    },
  ];
};

// Dynamic decorator
export const postDynamicLookup = ({
  userId,
}: {
  userId?: string | null;
}): PipelineStage[] => {
  if (!userId) return [];

  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  return [
    // Targeted Gist Likes
    {
      $lookup: {
        from: "gist_likes",
        let: { currentId: "$_id", type: "$postType" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$type", "GIST"] },
                  { $eq: ["$gistId", "$$currentId"] },
                  { $eq: ["$userId", userObjectId] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "gistLikeDoc",
      },
    },
    // Targeted Stake Likes
    {
      $lookup: {
        from: "stake_likes",
        let: { currentId: "$_id", type: "$postType" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$type", "STAKE"] },
                  { $eq: ["$stakeId", "$$currentId"] },
                  { $eq: ["$userId", userObjectId] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "stakeLikeDoc",
      },
    },
    // Follower Relationships
    {
      $lookup: {
        from: "follows",
        let: { authorId: "$authorId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", userObjectId] },
                  { $eq: ["$followingId", "$$authorId"] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "followDoc",
      },
    },
    {
      $lookup: {
        from: "follows",
        let: { authorId: "$authorId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", "$$authorId"] },
                  { $eq: ["$followingId", userObjectId] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "followerDoc",
      },
    },
  ];
};
