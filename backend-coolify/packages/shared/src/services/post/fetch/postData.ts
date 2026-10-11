import { PipelineStage } from "mongoose";
import { postStaticLookup, postDynamicLookup } from "./dataLookup";
import { POST_NESTED_FIELDS } from "@repo/database";

/**
 * Generates the full static data pipeline for Posts (Gists & Stakes).
 * Optimized for React frontend consumption with flattened details.
 */
export const getPostStaticData = (): PipelineStage[] => {
  return [
    // Join with Users and Media collections
    ...postStaticLookup(),

    // Structural Formatting & Author Normalization
    {
      $project: {
        _id: 1,
        authorId: 1,
        postType: 1,
        createdAt: 1,
        media: { $ifNull: ["$media", []] },
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        shareCount: { $ifNull: ["$shareCount", 0] },
        viewCount: { $ifNull: ["$viewCount", 0] },
        topics: { $ifNull: ["$topics", []] },
        visibility: "$visibility",
        location: "$location",

        // Constructing Author object
        author: {
          _id: { $ifNull: ["$authorDetails._id", "$authorId"] },
          username: {
            $toLower: {
              $ifNull: ["$authorDetails.username", "anonymous"],
            },
          },
          displayName: { $ifNull: ["$authorDetails.displayName", "anonymous"] },
          profileImage: { $ifNull: ["$authorDetails.profileImage", null] },
        },
        // Conditional logic to flatten unique fields based on postType
        details: {
          $cond: [
            { $eq: ["$postType", "GIST"] },
            {
              // Mapping to Gist Schema (latestCaption)
              latestCaption: {
                caption: {
                  $ifNull: [`$${POST_NESTED_FIELDS.LATEST_CAPTION}`, ""],
                },
                captionId: {
                  $ifNull: [`$${POST_NESTED_FIELDS.LATEST_CAPTION_ID}`, "$_id"],
                },
                detectedLanguage: {
                  $ifNull: [
                    `$${POST_NESTED_FIELDS.LATEST_CAPTION_DETECTED_LANGUAGE}`,
                    "en",
                  ],
                },
                updatedAt: {
                  $ifNull: [
                    `$${POST_NESTED_FIELDS.LATEST_CAPTION_CREATED_AT}`,
                    "$createdAt",
                  ],
                },
              },
              isEdited: { $gt: [{ $ifNull: ["$editCount", 0] }, 0] },
            },
            {
              // Standard Stake structure
              amount: { $ifNull: ["$amount", 0] },
              odds: { $ifNull: ["$odds", 1.0] },
              selection: { $ifNull: ["$selection", ""] },
              market: { $ifNull: ["$market", ""] },
              outcome: { $ifNull: ["$outcome", "PENDING"] },
            },
          ],
        },
      },
    },

    //  Flattening: We move everything inside 'details' to the top level for cleaner frontend access
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$$ROOT", "$details"],
        },
      },
    },

    // Final Cleanup: Remove the temporary details object
    {
      $project: {
        details: 0,
      },
    },
  ] as PipelineStage[];
};

// Dynamic Post data
export const getPostSocialData = ({
  userId,
}: {
  userId: string;
}): PipelineStage[] => {
  return [
    ...postDynamicLookup({ userId }),
    {
      $project: {
        _id: 1,
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        shareCount: { $ifNull: ["$shareCount", 0] },
        viewCount: { $ifNull: ["$viewCount", 0] },

        likedByMe: {
          $gt: [
            {
              $size: {
                $setUnion: [
                  { $ifNull: ["$gistLikeDoc", []] },
                  { $ifNull: ["$stakeLikeDoc", []] },
                ],
              },
            },
            0,
          ],
        },
        isFollowing: { $gt: [{ $size: { $ifNull: ["$followDoc", []] } }, 0] },
        followsMe: { $gt: [{ $size: { $ifNull: ["$followerDoc", []] } }, 0] },
      },
    },
  ];
};
