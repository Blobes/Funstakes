import {
  GistModel,
  ILocation,
  IMedia,
  PostContentStatus,
} from "@repo/database";
import {
  generateRandomIp,
  getLocationFromIp,
  finalizeGistCreation,
  enqueueModerationTask,
  MESSAGES_REGISTRY,
  TransInfo,
  IPostModData,
  FinalizePostReq,
  ModerationTaskMode,
  enqueueMediaTask,
  extractTopicsFromCaption,
} from "@repo/shared";

export interface CreateGistInput {
  userId?: string;
  caption?: string;
  media?: IMedia[];
  topics?: string[];
  skipModeration?: boolean;
  hasSensitiveGraphic?: boolean;
  s3Config: any;
  redisUrl: string;
  userIp?: string;
}

export interface CreateGistResult {
  status:
    | "INVALID_SESSION"
    | "MISSING_CONTENT"
    | "SUCCESS_BYPASS"
    | "SUCCESS_QUEUED";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Orchestrates spatial coordinates assignment, baseline status assignment, conditional S3 pipeline completion, and Redis task distribution profiles.
 */
export const executeCreateGist = async (
  input: CreateGistInput,
): Promise<CreateGistResult> => {
  const {
    userId,
    caption,
    media,
    topics,
    skipModeration = false,
    hasSensitiveGraphic = false,
    s3Config,
    redisUrl,
    userIp,
  } = input;

  if (!userId) {
    return {
      status: "INVALID_SESSION",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_SESSION("Gist"),
      payload: null,
    };
  }

  const hasCaption = caption && caption.trim().length > 0;
  const hasMedia = media && Array.isArray(media) && media.length > 0;

  if (!hasCaption && !hasMedia) {
    return {
      status: "MISSING_CONTENT",
      transInfo: MESSAGES_REGISTRY.POST.CONTENT_REQUIRED("Gist"),
      payload: null,
    };
  }

  const geoData = await getLocationFromIp(generateRandomIp());
  const location = geoData
    ? ({
        name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
        city: geoData.city,
        state: geoData.state,
        country: geoData.country,
        type: "Point" as const,
        coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
      } as ILocation)
    : undefined;

  // Auto-extract topics from caption if user provided no topics
  const userTopics = topics && topics.length > 0 ? topics : [];
  const hasUserTopics = userTopics.length > 0;

  let systemTopics: string[] = [];
  if (!hasUserTopics && hasCaption) {
    systemTopics = await extractTopicsFromCaption(caption);
  }
  const hasSytemTopics = systemTopics.length > 0;

  const finalTopics = userTopics || systemTopics;

  const initialStatus: PostContentStatus = skipModeration
    ? "PUBLISHED"
    : "UNDER_REVIEW";

  const newGist = await GistModel.create({
    authorId: userId,
    status: initialStatus,
    location,
    latestCaption: { caption: caption?.trim() },
    hasSensitiveGraphic,
  });

  if (skipModeration) {
    await finalizeGistCreation(
      {
        postId: newGist._id.toString(),
        userId: userId.toString(),
        postType: "GIST",
        caption,
        media: media || [],
        event: "POST_CREATION",
        modResult: {
          status: "PUBLISHED",
          hasSensitiveGraphic,
          ruleViolated: "",
          severity: "NONE",
          reason:
            "Moderation skipped by administrative directive bypass constraints.",
          extractedTopics: finalTopics,
          topicsSource: hasUserTopics ? "USER" : "SYSTEM",
          needsReview: false,
        },
      } as FinalizePostReq,
      { s3Config, redisKey: redisUrl },
    );

    return {
      status: "SUCCESS_BYPASS",
      transInfo: MESSAGES_REGISTRY.POST.BYPASS_CREATION_SUCCESS("Gist"),
      payload: { gistId: newGist._id },
    };
  }

  let modTaskMode: ModerationTaskMode;
  if (skipModeration) {
    modTaskMode = "EXTRACT_KEYWORDS_ONLY";
  } else {
    modTaskMode =
      hasUserTopics || hasSytemTopics
        ? "MODERATE_ONLY"
        : "MODERATE_AND_EXTRACT_KEYWORDS";
  }

  // Enqueue media processing task
  if (media)
    await enqueueMediaTask({
      targetId: newGist._id.toString(),
      media,
      redisUrl,
    });

  const moderationData: IPostModData = {
    postId: newGist._id.toString(),
    postType: "GIST",
    event: "POST_CREATION",
    userId: userId.toString(),
    caption,
    media,
    topics: topics || [],
    topicsSource: hasUserTopics ? "USER" : "SYSTEM",
    moderationTaskMode: modTaskMode,
  };

  await enqueueModerationTask({
    typename: "moderate:post",
    payload: moderationData,
    redisUrl,
  });

  const completionMessage = skipModeration
    ? MESSAGES_REGISTRY.POST.POST_TOPICS_EXTRACTING
    : MESSAGES_REGISTRY.POST.PROCESSING_INITIATED;

  return {
    status: "SUCCESS_QUEUED",
    transInfo: completionMessage("Gist"),
    payload: { gistId: newGist._id },
  };
};
