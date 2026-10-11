import { Types } from "mongoose";
import {
  ModerationCaseModel,
  ModerationReportModel,
  UserModel,
  GistModel,
  StakeModel,
  MediaModel,
  EntityType,
  ModerationSourceType,
  ModerationSeverity,
  ModerationCategory,
  ModerationEvidenceModel,
  ModerationEvidenceType,
  MODERATION_CASE_NESTED_FIELDS,
} from "@repo/database";
import { calculateThreshold } from "../../utils/calculations";
import { PostType, TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { switchAccountStatus } from "../user/accountStatus";

export interface IEvidenceSnapshot {
  evidenceType: ModerationEvidenceType;
  title: string;
  content?: string | null;
  media?: string[];
  metadata?: Record<string, any> | null;
}

export interface IExecuteReportInput {
  targetId: string;
  targetType: EntityType;
  targetOwner: string;
  postType?: PostType | null;
  source: ModerationSourceType;
  priority: ModerationSeverity;
  reason: ModerationCategory;
  description?: string | null;
  evidence?: IEvidenceSnapshot[] | null;
}

export interface IExecuteReportResult {
  escalated: boolean;
  transInfo: TransInfo;
  logId: string;
  status: "SUCCESS" | "CONFLICT" | "NOT_FOUND";
}

const MAX_MODERATION_ATTEMPTS = 3;

/**
 * Executes the core content moderation reporting, evaluation, and escalation pipeline.
 */
export const executeCaseReport = async (
  payload: IExecuteReportInput,
  reporterId: string | null,
): Promise<IExecuteReportResult> => {
  const {
    targetId,
    targetType,
    targetOwner,
    postType = null,
    source,
    priority,
    reason,
    description = null,
    evidence = null,
  } = payload;

  // Manage/Create Standard Case File using strictly IModerationCase options
  const flaggedRecord = await ModerationCaseModel.findOneAndUpdate(
    { targetId, targetType },
    {
      $setOnInsert: {
        targetOwner: new Types.ObjectId(targetOwner),
        status: "OPEN",
        decision: "NONE",
        title: `Moderation case file for ${targetType} violation`,
        description:
          description ||
          `Automated file initialization for flagged ${targetType}`,
        priority,
        aiGenerated: source === "AI",
        requiresHumanReview: true,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  // Record Unique Report directly using fields from your strict IModerationReport schema
  try {
    await ModerationReportModel.create({
      moderationCase: flaggedRecord._id,
      reporter: reporterId ? new Types.ObjectId(reporterId) : null,
      source,
      reason,
      description,
      isDuplicate: false,
    });
  } catch (e: any) {
    if (e.code === 11000) {
      return {
        escalated: false,
        transInfo:
          MESSAGES_REGISTRY.ADMIN.MODERATION_DATA_ALREADY_REPORTED(targetType),
        logId: String(flaggedRecord._id),
        status: "CONFLICT",
      };
    }
    throw e;
  }

  // --- Evidentiary Collection Pipeline ---
  if (evidence && evidence.length > 0) {
    const evidenceRecords = evidence.map((item) => ({
      moderationCase: flaggedRecord._id,
      type: item.evidenceType,
      title: item.title,
      content: item.content || null,
      media: item.media?.map((m) => new Types.ObjectId(m)) || [],
      metadata: item.metadata || null,
      collectedBy: source === "AI" ? "AI" : "SYSTEM",
      collectedByIdentity: reporterId ? new Types.ObjectId(reporterId) : null,
    }));

    await ModerationEvidenceModel.insertMany(evidenceRecords);
  }

  // --- Dynamic Domain Content Mapping Pipeline ---
  let TargetModel: any = null;
  let statusFieldName = "status";
  let reviewMetricSelector = "viewCount";

  switch (targetType) {
    case "POST":
      TargetModel = postType === "STAKE" ? StakeModel : GistModel;
      break;
    case "MEDIA":
      TargetModel = MediaModel;
      statusFieldName = "status";
      reviewMetricSelector = "size";
      break;
    case "PROFILE":
      TargetModel = UserModel;
      statusFieldName = "accountStatus";
      reviewMetricSelector = "createdAt";
      break;
    case "COMMENT":
      // TargetModel = CommentModel;
      break;
  }

  if (!TargetModel) {
    return {
      escalated: false,
      transInfo: MESSAGES_REGISTRY.ADMIN.MODERATION_DATA_SOURCE_NOT_FOUND,
      logId: String(flaggedRecord._id),
      status: "NOT_FOUND",
    };
  }

  // Fetch Core Metadata properties safely
  const targetData = await TargetModel.findById(targetId).select(
    `${statusFieldName} ${reviewMetricSelector} moderationCase`,
  );

  if (!targetData) {
    return {
      escalated: false,
      transInfo: MESSAGES_REGISTRY.ADMIN.MODERATION_DATA_SOURCE_NOT_FOUND,
      logId: String(flaggedRecord._id),
      status: "NOT_FOUND",
    };
  }

  const metricValue = targetData.get(reviewMetricSelector) || 0;
  const currentAttemptsCount = targetData.moderationCase?.caseCount || 0;
  const currentStatusValue = targetData.get(statusFieldName);

  // Threshold calculations using active reports linked to the open case file
  const reportCount = await ModerationReportModel.countDocuments({
    moderationCase: flaggedRecord._id,
    source: "USER",
  });
  const criticalCount = await ModerationReportModel.countDocuments({
    moderationCase: flaggedRecord._id,
    reason,
  });
  const currentThreshold = calculateThreshold(metricValue);
  const isCriticalMass =
    reportCount > 0 &&
    (criticalCount / reportCount) * 100 >= 50 &&
    criticalCount >= currentThreshold;
  const shouldEscalate =
    source === "AI" || reportCount >= currentThreshold || isCriticalMass;

  if (shouldEscalate) {
    const updatePromises: any[] = [];

    if (isCriticalMass && flaggedRecord.priority !== "CRITICAL") {
      updatePromises.push(
        ModerationCaseModel.findByIdAndUpdate(flaggedRecord._id, {
          priority: "HIGH",
        }),
      );
    }

    // AUTO-REJECTION/BAN pipeline executing on verified system parameters
    const isAlreadyBanned = currentStatusValue === "BANNED";

    if (!isAlreadyBanned) {
      if (targetType === "PROFILE") {
        // Enforce specific metrics for profiles instead of standard max attempt restrictions
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const historicSuspensionsCount =
          await ModerationCaseModel.countDocuments({
            targetOwner: new Types.ObjectId(targetOwner),
            status: "RESOLVED",
            decision: "ACCOUNT_SUSPENDED",
            resolvedAt: { $gte: threeMonthsAgo },
          });

        if (historicSuspensionsCount >= 15) {
          updatePromises.push(
            TargetModel.findByIdAndUpdate(targetId, {
              $set: {
                [statusFieldName]: "BANNED",
                updatedAt: new Date(),
              },
            }),
            ModerationCaseModel.findByIdAndUpdate(flaggedRecord._id, {
              status: "RESOLVED",
              decision: "ACCOUNT_BANNED",
              resolvedAt: new Date(),
            }),
            ModerationReportModel.deleteMany({
              moderationCase: flaggedRecord._id,
            }),
          );

          await Promise.all(updatePromises);
          return {
            escalated: true,
            transInfo:
              MESSAGES_REGISTRY.ADMIN.MODERATION_DATA_BANNED(targetType),
            logId: String(flaggedRecord._id),
            status: "SUCCESS",
          };
        }

        // Evaluate time-bound user report thresholds (more than 30 unique reports in the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentReportsCount = await ModerationReportModel.countDocuments({
          moderationCase: flaggedRecord._id,
          createdAt: { $gte: sevenDaysAgo },
        });

        if (recentReportsCount > 30 && currentStatusValue !== "SUSPENDED") {
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);

          updatePromises.push(
            switchAccountStatus({
              targetUserId: targetOwner,
              targetStatus: "SUSPENDED",
              reason: `Automated safety suspension triggered due to receiving ${recentReportsCount} reports within a 7-day trailing window.`,
              changedBy: "SYSTEM",
              changedByType: "SYSTEM",
              suspensionExpiresAt: expires,
            }),
          );
        }
      } else if (currentAttemptsCount >= MAX_MODERATION_ATTEMPTS) {
        // Fallback pipeline for non-profile assets (POST, MEDIA)
        const updatedUser = await UserModel.findByIdAndUpdate(
          targetOwner,
          {
            $inc: { policyBreachCount: 1 },
            $set: { updatedAt: new Date() },
          },
          { new: true },
        );

        updatePromises.push(
          TargetModel.findByIdAndUpdate(targetId, {
            $set: {
              [statusFieldName]: "BANNED",
              [MODERATION_CASE_NESTED_FIELDS.MODERATION_CASE_ID]:
                flaggedRecord._id,
              updatedAt: new Date(),
            },
          }),
          ModerationCaseModel.findByIdAndUpdate(flaggedRecord._id, {
            status: "RESOLVED",
            decision: "CONTENT_REMOVED",
            resolvedAt: new Date(),
          }),
          ModerationReportModel.deleteMany({
            moderationCase: flaggedRecord._id,
          }),
        );

        const computedUserStrikes = updatedUser?.policyBreachCount || 0;
        if (computedUserStrikes >= 3) {
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);

          updatePromises.push(
            switchAccountStatus({
              targetUserId: targetOwner,
              targetStatus: "SUSPENDED",
              reason:
                MESSAGES_REGISTRY.ADMIN.MODERATION_AUTOMATED_SUSPENSION_REASON(
                  computedUserStrikes,
                ).message,
              changedBy: "SYSTEM",
              changedByType: "SYSTEM",
              suspensionExpiresAt: expires,
            }),
          );
        }

        await Promise.all(updatePromises);
        return {
          escalated: true,
          transInfo: MESSAGES_REGISTRY.ADMIN.MODERATION_DATA_BANNED(targetType),
          logId: String(flaggedRecord._id),
          status: "SUCCESS",
        };
      }
    }

    // STANDARD ESCALATION mapping targets directly to exact schema strings
    let targetStatus = "UNDER_REVIEW";
    if (targetType === "POST") {
      targetStatus = reason === "OTHER" ? "SHADOWBANNED" : "UNDER_REVIEW";
    } else if (targetType === "PROFILE") {
      targetStatus = currentStatusValue;
    }

    if (currentStatusValue !== targetStatus) {
      const assetPayload: Record<string, any> = {
        $set: {
          [statusFieldName]: targetStatus,
          updatedAt: new Date(),
        },
      };

      // Set internal tracking reference strictly on compatible non-profile collections
      if (targetType !== "PROFILE") {
        assetPayload.$set[MODERATION_CASE_NESTED_FIELDS.MODERATION_CASE_ID] =
          flaggedRecord._id;
      }

      updatePromises.push(
        TargetModel.findByIdAndUpdate(targetId, assetPayload),
        ModerationCaseModel.findByIdAndUpdate(flaggedRecord._id, {
          status: "UNDER_REVIEW",
        }),
      );
    }

    await Promise.all(updatePromises);
  }

  return {
    escalated: shouldEscalate,
    transInfo: shouldEscalate
      ? MESSAGES_REGISTRY.ADMIN.MODERATION_DATA_PLACED_UNDER_REVIEW
      : MESSAGES_REGISTRY.ADMIN.MODERATION_REPORT_RECEIVED,
    logId: String(flaggedRecord._id),
    status: "SUCCESS",
  };
};
