import mongoose from "mongoose";
import { GistModel, IMedia, PostCaptionModel, UserModel } from "@repo/database";
import { FinalizePostReq, IS3Config } from "../../types/general";
import { hardDeleteMedia } from "../media/hardDelete";
import { createMediaBatch } from "../media/createBatch";
import { executePostTopicsSync } from "../topic/postSync";
import { franc } from "franc-min";
import { to2ISOCode } from "../../constants/others";
import { executeCaseReport, IEvidenceSnapshot } from "../moderation/reportCase";
import { notifyUser } from "../redis/socket";

interface Config {
  redisKey?: string;
  s3Config: IS3Config;
}

/**
 * Commits the finalized state from processing into MongoDB for initial post creation.
 */
export const finalizeGistCreation = async (
  params: FinalizePostReq,
  config: Config,
) => {
  const { postId, userId, caption, media, modResult, topicsSource, session } =
    params;

  if (modResult.status === "BANNED") {
    await UserModel.findByIdAndUpdate(
      userId,
      { $set: { hasFlaggedPost: true } },
      { session },
    );

    const rawFileKeys =
      media?.map((item: IMedia) => item.fileKey).filter(Boolean) || [];

    if (rawFileKeys.length > 0) {
      await hardDeleteMedia({
        rawFileKeys,
        s3Config: config.s3Config,
      });
    }

    const droppedShell = await GistModel.findByIdAndDelete(postId, {
      session: session,
    });

    try {
      await notifyUser(
        userId,
        "CONTENT_REJECTED",
        {
          postId,
          type: "GIST",
          event: "POST_CREATION",
          reason: modResult.reason || "Safety violation profile detected.",
        },
        config.redisKey || "",
      );
    } catch (err) {
      console.error("Non-blocking creation ban socket broadcast failure:", err);
    }

    return droppedShell;
  }

  if (modResult.ruleViolated === "AI_ERROR") {
    const evidenceList: IEvidenceSnapshot[] = [];

    if (caption) {
      evidenceList.push({
        evidenceType: "TEXT",
        title: "Gist Post Caption Snapshot",
        content: caption,
        metadata: { wordCount: caption.split(/\s+/).length },
      });
    }

    const mediaUrls =
      media?.map((item: IMedia) => item.url).filter(Boolean) || [];
    if (mediaUrls.length > 0) {
      evidenceList.push({
        evidenceType: "URL",
        title: "Gist Post Media URLs Snapshot",
        content: JSON.stringify(mediaUrls),
        metadata: { totalFiles: mediaUrls.length },
      });
    }

    await executeCaseReport(
      {
        targetId: postId,
        targetType: "POST",
        targetOwner: userId.toString(),
        postType: "GIST",
        source: "AI",
        priority: modResult.severity || "MEDIUM",
        reason: "OTHER",
        description:
          modResult.reason ||
          "Automated escalation: AI processing pipeline experienced a terminal validation failure.",
        evidence: evidenceList,
      },
      null,
    );
  }

  const existingGistShell = await GistModel.findById(postId).session(
    session || null,
  );

  const determinedSensitiveGraphic =
    !existingGistShell?.hasSensitiveGraphic || !modResult.hasSensitiveGraphic;

  const targetTopics =
    modResult.extractedTopics || modResult.newTopicsFromAi || [];

  if (targetTopics.length > 0) {
    await executePostTopicsSync(
      {
        topics: targetTopics,
        targetId: postId,
        targetModel: "Gist",
        eventType: "POST_CREATION_OR_UPDATE",
        addedBy: topicsSource,
      },
      session,
    );
  }

  const uploadedMediaIdsPromise = createMediaBatch(media, userId, session, {
    sourceId: new mongoose.Types.ObjectId(postId),
    sourceType: "GIST",
  });

  const detectedIso3 = franc(caption, { minLength: 3 });
  const detectedIso2 = to2ISOCode(detectedIso3);
  const captionPromise = PostCaptionModel.create(
    [
      {
        postId,
        postType: "Gist",
        caption: caption?.trim() || "",
        detectedLanguage: detectedIso2,
        version: 1,
        isLatest: true,
      },
    ],
    { session },
  );

  const [uploadedMediaIds, [initialCaption]] = await Promise.all([
    uploadedMediaIdsPromise,
    captionPromise,
  ]);

  try {
    await notifyUser(
      userId,
      "GIST_STATUS_UPDATE",
      {
        userId: userId.toString(),
        type: "GIST_PROCESSED",
        payload: {
          gistId: postId,
          status:
            modResult.ruleViolated === "AI_ERROR"
              ? "SHADOWBANNED"
              : modResult.status,
          hasSensitiveGraphic: determinedSensitiveGraphic,
        },
      },
      config.redisKey || "",
    );
  } catch (err) {
    console.error(
      "Non-blocking initialization websocket broadcast failure:",
      err,
    );
  }

  await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { postCountWindow: 1 } },
    { session },
  );

  const freshlyEvaluatedGist = await GistModel.findById(postId).session(
    session || null,
  );
  const dynamicActiveCaseId =
    freshlyEvaluatedGist?.moderationCase?.caseId || null;

  return await GistModel.findByIdAndUpdate(
    postId,
    {
      mediaIds: uploadedMediaIds,
      latestCaption: {
        captionId: initialCaption._id,
        caption: initialCaption.caption,
        detectedLanguage: detectedIso2,
      },
      topics: targetTopics.map((t) => t.trim().toLowerCase()),
      status:
        modResult.ruleViolated === "AI_ERROR"
          ? "SHADOWBANNED"
          : modResult.status,
      hasSensitiveGraphic: determinedSensitiveGraphic,
      ...(dynamicActiveCaseId
        ? { "moderationCase.caseId": dynamicActiveCaseId }
        : {}),
    },
    { session, new: true, lean: true },
  );
};

/**
 * Commits updated text content versions to MongoDB after validation checks pass.
 */
export const finalizeGistUpdate = async (
  params: FinalizePostReq,
  config: Config,
) => {
  const { postId, userId, caption, modResult, session, topicsSource } = params;

  if (modResult.status === "BANNED") {
    await UserModel.findByIdAndUpdate(
      userId,
      { $set: { hasFlaggedPost: true } },
      { session },
    );

    try {
      await notifyUser(
        userId,
        "CONTENT_REJECTED",
        {
          postId,
          type: "GIST",
          event: "POST_UPDATE",
          reason:
            modResult.reason ||
            "Updated text content violated safety guidelines.",
        },
        config.redisKey || "",
      );
    } catch (err) {
      console.error(
        "Non-blocking update validation socket broadcast failure:",
        err,
      );
    }

    return await GistModel.findByIdAndUpdate(
      postId,
      { $set: { status: "PUBLISHED" } },
      { session, new: true, lean: true },
    );
  }

  const gist = await GistModel.findById(postId).session(session || null);
  if (!gist) {
    throw new Error(
      `Target Gist container reference not found for update resolution: ${postId}`,
    );
  }

  const determinedSensitiveGraphic =
    !gist.hasSensitiveGraphic || !modResult.hasSensitiveGraphic;

  const targetTopics = modResult.extractedTopics || [];

  if (targetTopics.length > 0) {
    await executePostTopicsSync(
      {
        topics: targetTopics,
        targetId: postId,
        targetModel: "Gist",
        eventType: "POST_CREATION_OR_UPDATE",
        addedBy: topicsSource,
      },
      session,
    );
  }

  const upcomingEditCount = (gist.editCount || 0) + 1;
  const nextVersion = upcomingEditCount + 1;

  const detectedIso3 = franc(caption, { minLength: 3 });
  const detectedIso2 = to2ISOCode(detectedIso3);
  const [newCaptionDoc] = await PostCaptionModel.create(
    [
      {
        postId,
        postType: "Gist",
        caption: caption?.trim() || "",
        detectedLanguage: detectedIso2,
        version: nextVersion,
        isLatest: true,
      },
    ],
    { session },
  );

  await PostCaptionModel.updateMany(
    { postId, postType: "Gist", _id: { $ne: newCaptionDoc._id } },
    { $set: { isLatest: false } },
    { session },
  );

  try {
    await notifyUser(
      userId,
      "GIST_STATUS_UPDATE",
      {
        userId: userId.toString(),
        type: "GIST_UPDATED",
        payload: {
          gistId: postId,
          status:
            modResult.ruleViolated === "AI_ERROR"
              ? "SHADOWBANNED"
              : modResult.status,
        },
      },
      config.redisKey || "",
    );
  } catch (err) {
    console.error(
      "Non-blocking caption update websocket broadcast failure:",
      err,
    );
  }

  await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { postCountWindow: 1 } },
    { session },
  );

  if (modResult.ruleViolated === "AI_ERROR") {
    const evidenceList: IEvidenceSnapshot[] = [];

    if (caption) {
      evidenceList.push({
        evidenceType: "TEXT",
        title: "Gist Edited Caption Snapshot",
        content: caption,
        metadata: { version: nextVersion },
      });
    }

    const activeMediaIds = gist.mediaIds?.map((id: any) => id.toString()) || [];
    if (activeMediaIds.length > 0) {
      evidenceList.push({
        evidenceType: "SYSTEM_METADATA",
        title: "Gist Active Media Attachment References",
        content: JSON.stringify(activeMediaIds),
        metadata: { totalFiles: activeMediaIds.length },
      });
    }

    await executeCaseReport(
      {
        targetId: postId,
        targetType: "POST",
        targetOwner: userId.toString(),
        postType: "GIST",
        source: "AI",
        priority: modResult.severity || "MEDIUM",
        reason: "OTHER",
        description:
          modResult.reason ||
          "Automated escalation: AI processing pipeline experienced a terminal validation failure during a text update cycle.",
        evidence: evidenceList,
      },
      null,
    );
  }

  const freshlyEvaluatedGist = await GistModel.findById(postId).session(
    session || null,
  );
  const dynamicActiveCaseId =
    freshlyEvaluatedGist?.moderationCase?.caseId || null;

  await GistModel.findByIdAndUpdate(
    postId,
    {
      $inc: { editCount: 1 },
      $set: {
        latestCaption: {
          captionId: newCaptionDoc._id,
          caption: newCaptionDoc.caption,
          detectedLanguage: newCaptionDoc.detectedLanguage,
        },
        topics: targetTopics.map((t) => t.trim().toLowerCase()),
        status: modResult.status,
        hasSensitiveGraphic: determinedSensitiveGraphic,
        ...(dynamicActiveCaseId
          ? { "moderationCase.caseId": dynamicActiveCaseId }
          : {}),
      },
    },
    { session, new: true, lean: true },
  );

  return;
};
