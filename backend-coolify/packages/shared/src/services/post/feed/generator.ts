import { PipelineStage, Types, QueryFilter } from "mongoose";
import { getPostStaticData } from "../fetch/postData";
import { UserPreferencesResult } from "./userPrefs";
import { PostType } from "../../../types/general";
import { POST_NESTED_FIELDS } from "@repo/database";

export interface ListOptions<TPost = Record<string, unknown>> {
  matchFilter?: QueryFilter<TPost>;
  limit?: number;
  skip?: number;
  postType?: PostType;
}

const DEFAULT_FEED_LIMIT = 20;

/**
 * Constructs an optimized MongoDB aggregation pipeline for combined post listings and feeds.
 */
export const getStaticPostList = <TPost = Record<string, unknown>>({
  matchFilter = {},
  limit = DEFAULT_FEED_LIMIT,
  skip = 0,
  postType,
}: ListOptions<TPost>): PipelineStage[] => {
  const initialType: PostType = postType || "GIST";

  const pipeline: PipelineStage[] = [
    { $match: matchFilter },
    { $addFields: { postType: initialType } },
  ];

  // Merge stakes collection when no explicit post type constraint is provided
  if (!postType) {
    const unionStage: PipelineStage.UnionWith = {
      $unionWith: {
        coll: "stakes",
        pipeline: [
          { $match: matchFilter },
          { $addFields: { postType: "STAKE" as PostType } },
        ],
      },
    };
    pipeline.push(unionStage);
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...getPostStaticData(),
  );

  return pipeline;
};

interface CandidatePipelineOptions {
  userPrefs?: UserPreferencesResult | null;
  limit?: number;
  skip?: number;
  postType?: "GIST" | "STAKE";
}
/**
 * Generates an aggregated feed pipeline using candidate generation, safety filters, database scoring, and time decay.
 */
export const getCandidatePostPipeline = ({
  userPrefs,
  limit = 20,
  skip = 0,
  postType,
}: CandidatePipelineOptions): PipelineStage[] => {
  const pipeline: PipelineStage[] = [];
  const initialType = postType || "GIST";

  // Stage 1: Base Hard Filters (Status & Type)
  const baseMatch: Record<string, any> = {
    status: "PUBLISHED",
  };

  // Apply Hard Blocked Authors & Safety Filters at Database Level
  if (userPrefs) {
    if (userPrefs.blockedUserIds.length > 0) {
      baseMatch.authorId = {
        $nin: userPrefs.blockedUserIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const showSensitiveMedia =
      userPrefs.settings?.display?.showSensitiveMedia ?? false;
    if (!showSensitiveMedia) {
      baseMatch.hasSensitiveGraphic = false;
    }

    // Muted Words Regex Exclusion
    if (userPrefs.mutedWords && userPrefs.mutedWords.length > 0) {
      const regexPattern = userPrefs.mutedWords.join("|");
      baseMatch[POST_NESTED_FIELDS.LATEST_CAPTION] = {
        $not: new RegExp(regexPattern, "i"),
      };
    }
  }

  pipeline.push(
    { $match: baseMatch },
    { $addFields: { postType: initialType } },
  );

  // Combine collections for combined Gist & Stake feeds
  if (!postType) {
    pipeline.push({
      $unionWith: {
        coll: "stakes",
        pipeline: [
          { $match: baseMatch },
          { $addFields: { postType: "STAKE" } },
        ] as any[],
      },
    });
  }

  // Stage 2: Database Scoring Stage (If user preferences are active)
  if (userPrefs) {
    const preferredTopics =
      userPrefs.settings?.display?.contentPreferences?.preferredTopics || [];
    const preferredTopicIds = preferredTopics.map((t) => String(t.topicId));

    const userCoordinates = userPrefs.location?.coordinates || null;

    pipeline.push({
      $addFields: {
        // Topic Match Bonus (+10 points if topics intersect)
        topicScore: {
          $cond: [
            {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      { $ifNull: ["$topics", []] },
                      preferredTopicIds,
                    ],
                  },
                },
                0,
              ],
            },
            10,
            0,
          ],
        },

        // Geo Proximity Score (+5 points if post has valid geo coordinates)
        geoScore: userCoordinates
          ? {
              $cond: [
                {
                  $and: [
                    { $isArray: `$${POST_NESTED_FIELDS.LOCATION_COORDINATES}` },
                    {
                      $eq: [
                        {
                          $size: `$${POST_NESTED_FIELDS.LOCATION_COORDINATES}`,
                        },
                        2,
                      ],
                    },
                  ],
                },
                5,
                0,
              ],
            }
          : 0,

        // Engagement Base Score
        engagementScore: {
          $add: [
            { $multiply: [{ $ifNull: ["$likeCount", 0] }, 1.5] },
            { $multiply: [{ $ifNull: ["$commentCount", 0] }, 2.0] },
            { $multiply: [{ $ifNull: ["$shareCount", 0] }, 3.0] },
          ],
        },

        // Post Age in Hours
        ageInHours: {
          $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60],
        },
      },
    });

    // Recency Time Decay Calculation: Score = (Base + Bonuses) / (Age + 2)^1.5
    pipeline.push({
      $addFields: {
        heuristicScore: {
          $divide: [
            { $add: ["$engagementScore", "$topicScore", "$geoScore", 1] },
            { $pow: [{ $add: ["$ageInHours", 2] }, 1.5] },
          ],
        },
      },
    });

    // Stage 3: Dynamic Sorting by Calculated Heuristic Score
    pipeline.push({ $sort: { heuristicScore: -1, createdAt: -1 } });
  } else {
    // Unauthenticated Default: Chronological Sort
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // Stage 4: Pagination & Candidate Cutoff
  pipeline.push({ $skip: skip }, { $limit: limit });

  // Stage 5: Static Data Projections
  pipeline.push(...getPostStaticData());

  return pipeline;
};
