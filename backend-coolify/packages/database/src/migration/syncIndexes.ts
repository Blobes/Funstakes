import mongoose from "mongoose";
import { DeviceModel } from "../models/entities/device";
import { GistModel } from "../models/entities/gist";
import { KycRequestModel } from "../models/entities/kyc";
import { MediaModel } from "../models/entities/media";
import { StakeModel } from "../models/entities/stake";
import { UserModel } from "../models/entities/user";
import {
  PermissionModel,
  RolePermissionModel,
} from "../models/non-entities/authorization/permissions";
import {
  RoleModel,
  UserRoleModel,
} from "../models/non-entities/authorization/role";
import { AccountStatusHistoryModel } from "../models/non-entities/identity/status";
import { UserSettingsModel } from "../models/non-entities/identity/userSettings";
import { ErrorLogModel, UserLogModel } from "../models/non-entities/logs";
import {
  ModerationCaseModel,
  ModerationEvidenceModel,
  ModerationReportModel,
  ModerationStrikeModel,
} from "../models/non-entities/moderation";
import { BookmarkModel } from "../models/non-entities/post/bookmark";
import { PostCaptionModel } from "../models/non-entities/post/caption";
import { PostLikeModel } from "../models/non-entities/post/postLikes";
import { PostViewModel } from "../models/non-entities/post/view";
import { BlockedModel, FollowModel } from "../models/non-entities/socials";
import { TopicModel } from "../models/non-entities/topic";
import { RelationTupleModel } from "../models/non-entities/authorization/relation";
import { SubscriptionModel } from "../models/non-entities/identity/subscription";
import { SecurityQuestionModel } from "../models/non-entities/securityQuestions";

const MONGO_URI = process.env.MONGO_URI || "";

/**
 * Synchronizes database schema indexes across all registered models.
 */
async function syncIndexes(): Promise<void> {
  if (!MONGO_URI) {
    console.error(
      "Database connection failed: MONGO_URI environment variable is missing.",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully for index syncing.");

    // Entity Models
    await UserModel.syncIndexes();
    await GistModel.syncIndexes();
    await DeviceModel.syncIndexes();
    await StakeModel.syncIndexes();
    await KycRequestModel.syncIndexes();
    await MediaModel.syncIndexes();

    // Non Entity Models
    await PermissionModel.syncIndexes();
    await RolePermissionModel.syncIndexes();
    await RoleModel.syncIndexes();
    await UserRoleModel.syncIndexes();
    await AccountStatusHistoryModel.syncIndexes();
    await UserSettingsModel.syncIndexes();
    await BookmarkModel.syncIndexes();
    await PostCaptionModel.syncIndexes();
    await PostLikeModel.syncIndexes();
    await PostViewModel.syncIndexes();
    await RelationTupleModel.syncIndexes();
    await SubscriptionModel.syncIndexes();
    await SecurityQuestionModel.syncIndexes();

    // Moderation Models
    await ModerationCaseModel.syncIndexes();
    await ModerationStrikeModel.syncIndexes();
    await ModerationReportModel.syncIndexes();
    await ModerationEvidenceModel.syncIndexes();

    // Log Models
    await UserLogModel.syncIndexes();
    await ErrorLogModel.syncIndexes();

    // Socials & Topic Models
    await FollowModel.syncIndexes();
    await BlockedModel.syncIndexes();
    await TopicModel.syncIndexes();

    console.log("Indexes synchronized successfully.");
  } catch (error) {
    console.error(
      "Database index synchronization encountered a critical error:",
      error,
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

syncIndexes();
