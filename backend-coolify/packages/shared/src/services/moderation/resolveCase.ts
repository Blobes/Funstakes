import { Types } from "mongoose";
import {
  ModerationCaseModel,
  ModerationReportModel,
  ModerationStrikeModel,
  UserModel,
  GistModel,
  StakeModel,
  MediaModel,
  CaseResolutionAction,
  ModerationDecision,
  ModerationCategory,
  ModeratorType,
  MODERATION_CASE_NESTED_FIELDS,
} from "@repo/database";
import { PostType, TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { switchAccountStatus } from "../user/accountStatus";
import { fetchSingleUser } from "../user/retrieve/fetchUser";

export interface IResolveCaseInput {
  caseId: string;
  resolution: CaseResolutionAction;
  decisionType: ModerationDecision;
  postType?: PostType | null;
  resolvedByType?: ModeratorType;
  category?: ModerationCategory;
  reasonNote?: string | null;
  moderatorId: string;
}

export interface IResolveCaseResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo?: TransInfo;
  payload?: {
    targetId: string;
    targetType: string;
    caseStatus: string;
    decision: ModerationDecision;
  } | null;
}

/**
 * Resolves moderation targets across all system domains, updates visibility states, issues infractions, and cleans up reports.
 */
export const executeCaseResolution = async (
  input: IResolveCaseInput,
): Promise<IResolveCaseResult> => {
  const {
    caseId,
    resolution,
    decisionType,
    postType = null,
    resolvedByType = "ADMIN",
    category = "OTHER",
    reasonNote = null,
    moderatorId,
  } = input;

  const modCase = await ModerationCaseModel.findById(caseId);
  if (!modCase) {
    return {
      status: "NOT_FOUND",
      ...MESSAGES_REGISTRY.ADMIN.MODERATION_RECORD_NOT_FOUND,
    };
  }

  const isApproved = resolution === "APPROVED";
  const caseStatus = isApproved ? "DISMISSED" : "RESOLVED";
  const finalDecision = isApproved ? "CONTENT_RESTORED" : decisionType;

  // --- Dynamic Domain Content Mapping Pipeline ---
  let TargetModel: any = null;
  let statusFieldName = "status";
  let internalContentStatus = isApproved ? "PUBLISHED" : "BANNED";

  switch (modCase.targetType) {
    case "POST":
      TargetModel = postType === "STAKE" ? StakeModel : GistModel;
      break;
    case "MEDIA":
      TargetModel = MediaModel;
      statusFieldName = "status";
      internalContentStatus = isApproved ? "READY" : "BANNED";
      break;
    case "PROFILE":
      TargetModel = UserModel;
      statusFieldName = "accountStatus";
      internalContentStatus = isApproved ? "ACTIVE" : "BANNED";
      break;
    case "COMMENT":
      // TargetModel = CommentModel;
      break;
    case "MESSAGE":
      // TargetModel = MessageModel;
      break;
    case "COMMUNITY":
      // TargetModel = CommunityModel;
      break;
  }

  // Execute structural content modifications if models match
  if (TargetModel) {
    const contentPayload: Record<string, any> = {
      $set: { [statusFieldName]: internalContentStatus, updatedAt: new Date() },
    };

    if (isApproved) {
      // Clean target assets field flags if target is a generic post/media entity
      if (modCase.targetType !== "PROFILE") {
        contentPayload.$unset = {
          [MODERATION_CASE_NESTED_FIELDS.MODERATION_CASE_ID]: null,
          [MODERATION_CASE_NESTED_FIELDS.MODERATION_CASE_COUNT]: 0,
        };
      }
    } else {
      if (modCase.targetType !== "PROFILE") {
        contentPayload.$set[MODERATION_CASE_NESTED_FIELDS.MODERATION_CASE_ID] =
          modCase._id;
      }
    }
    await TargetModel.findByIdAndUpdate(modCase.targetId, contentPayload);
  }

  // --- Core Identity Penalization & Account Lifecycle Pipeline ---
  if (!isApproved) {
    const userProfile = await fetchSingleUser({
      identifier: modCase.targetOwner,
      select: ["accountStatus"],
      flags: { skipFilter: true },
    });

    if (userProfile) {
      const shouldIssueStrike =
        finalDecision === "STRIKE_ISSUED" ||
        finalDecision === "ACCOUNT_SUSPENDED" ||
        finalDecision === "ACCOUNT_BANNED" ||
        finalDecision === "ACCOUNT_DEACTIVATED";

      if (shouldIssueStrike) {
        // Increment global flat tracking user infraction counter
        const updatedUser = await UserModel.findByIdAndUpdate(
          modCase.targetOwner,
          { $inc: { policyBreachCount: 1 } },
          { new: true },
        );

        const currentPolicyBreachCount = updatedUser?.policyBreachCount || 1;

        await ModerationStrikeModel.create({
          account: modCase.targetOwner,
          issuedBy: new Types.ObjectId(moderatorId),
          issuedByType: resolvedByType,
          category,
          severity: modCase.priority,
          points: 1,
          reason:
            reasonNote ||
            `Violation resolved under decision: ${finalDecision} for ${modCase.title}`,
          relatedPostType: postType === "STAKE" ? "Stake" : "Gist",
          relatedPost: modCase.targetType === "POST" ? modCase.targetId : null,
          isActive: true,
        });

        if (finalDecision === "ACCOUNT_SUSPENDED") {
          const suspensionExpiresAt = new Date();

          // Compute true historical window boundaries
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          // Verify history explicitly against prior punitive decision classifications
          const dynamicRecentCase = await ModerationCaseModel.findOne({
            targetOwner: modCase.targetOwner,
            status: "RESOLVED",
            decision: { $in: ["ACCOUNT_SUSPENDED"] },
            resolvedAt: { $gte: oneMonthAgo },
          });

          const wasRecentlySuspended =
            userProfile.accountStatus === "SUSPENDED" ||
            dynamicRecentCase !== null;

          // Apply escalation multi-period factor using total counts if history targets are active
          const suspensionDays = wasRecentlySuspended
            ? 7 * currentPolicyBreachCount
            : 7;
          suspensionExpiresAt.setDate(
            suspensionExpiresAt.getDate() + suspensionDays,
          );

          await switchAccountStatus({
            targetUserId: modCase.targetOwner.toString(),
            targetStatus: "SUSPENDED",
            reason:
              reasonNote ||
              `Account suspension enforced for ${suspensionDays} days due to decision: ${finalDecision}`,
            changedBy: moderatorId,
            changedByType: resolvedByType,
            suspensionExpiresAt,
          });
        } else if (finalDecision === "ACCOUNT_BANNED") {
          await switchAccountStatus({
            targetUserId: modCase.targetOwner.toString(),
            targetStatus: "BANNED",
            reason: reasonNote || "Permanent administrative account ban",
            changedBy: moderatorId,
            changedByType: resolvedByType,
          });
        } else if (finalDecision === "ACCOUNT_DEACTIVATED") {
          await switchAccountStatus({
            targetUserId: modCase.targetOwner.toString(),
            targetStatus: "DEACTIVATED",
            reason:
              reasonNote || "Administrative account deactivation safety switch",
            changedBy: moderatorId,
            changedByType: resolvedByType,
          });
        }
      }
    }
  }

  // Update master case file logging properties
  await ModerationCaseModel.findByIdAndUpdate(caseId, {
    $set: {
      status: caseStatus,
      decision: finalDecision,
      resolvedBy: new Types.ObjectId(moderatorId),
      assignedModerator: new Types.ObjectId(moderatorId),
      resolvedAt: new Date(),
    },
  });

  // Purge referencing reports associated with this tracking log
  await ModerationReportModel.deleteMany({ moderationCase: modCase._id });

  return {
    status: "SUCCESS",
    ...MESSAGES_REGISTRY.ADMIN.MODERATION_CASE_RESOLVED,
    payload: {
      targetId: modCase.targetId.toString(),
      targetType: modCase.targetType,
      caseStatus,
      decision: finalDecision,
    },
  };
};
