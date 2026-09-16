import express, { Router } from "express";
import { updateBasicInfo } from "./info/controllers/updateBasic";
import { updateDemoInfo } from "./info/controllers/updateDemo";
import { changeUserImage } from "./media/controllers/changeImage";
import { removeUserImage } from "./media/controllers/removeImage";
import { changeUsername } from "./username/controller";
import { setPassword } from "./password/controllers/setPassword";
import { cancelEmailChange } from "./email/controllers/cancelChange";
import { getFollowers } from "./socials/controllers/getFollowers";
import { followUser } from "./socials/controllers/followUser";
import { finalizeEmailChange } from "./email/controllers/finalizeChange";
import { finalizePhoneChange } from "./phone/controllers/finalizeChange";
import { authenticate, optionallyAuthenticate } from "@/envVars";
import { getUserProfile } from "./info/controllers/getProfile";
import { changeAccountStatus } from "./account/accountStatus";
import { deleteAccount } from "./account/deleteAccount";
import { initiatePasswordReset } from "./password/controllers/initiateReset";
import { initiateEmailChange } from "./email/controllers/initiateChange";
import { initiatePhoneChange } from "./phone/controllers/initiateChange";
import { autoInvalidateUserCache } from "@repo/shared";
import { getUserSettings } from "./settings/general/controller";
import { updateDisplaySettings } from "./settings/display/controller";
import { updateNotificationSettings } from "./settings/notifications/controller";
import { updatePrivacySettings } from "./settings/privacy/controller";
import {
  addMutedWords,
  removeMutedWordsHandler,
} from "./settings/muted-words/controller";
import { removeUserTopics } from "./settings/topic/remove";
import { syncUserTopics } from "./settings/topic/update";
import {
  enforcePolicy,
  requirePermission,
  requireRole,
  userProfilePolicy,
  loadUserResource,
  checkAccountRestriction,
} from "@repo/security";
import { COMMUNITY_ROLES, PERMISSIONS, PLATFORM_ROLES } from "@repo/database";
import { reviewKyc } from "./kyc/controllers/reviewKyc";
import { submitKyc } from "./kyc/controllers/submitKyc";

const router: Router = express.Router();

// Health check endpoint for identity service.
router.get("/", (_req, res) => {
  res.json({ message: "Welcome to Funstakes User API" });
});

// --- USER PROFILE & INFO ---
// View User Profile: Checks account lifecycle state and social graph blocklists.
router.get(
  "/:id",
  optionallyAuthenticate,
  enforcePolicy(userProfilePolicy, loadUserResource("id")),
  getUserProfile,
);

router.patch(
  "/update/basic",
  authenticate,
  checkAccountRestriction,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  updateBasicInfo,
);

router.patch(
  "/update/demo",
  authenticate,
  checkAccountRestriction,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  updateDemoInfo,
);
router.patch(
  "/update/profile-image",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  changeUserImage,
);
router.delete(
  "/delete/profile-image",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  removeUserImage,
);

// --- USER ACCOUNT IDENTIFIERS & CREDENTIALS ---
router.post(
  "/change-email/initiate",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  initiateEmailChange,
);
router.patch(
  "/change-email/finalize",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  finalizeEmailChange,
);
router.post(
  "/change-email/cancel",
  authenticate,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  cancelEmailChange,
);
router.post(
  "/change-username",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  changeUsername,
);
router.post(
  "/change-phone/initiate",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  initiatePhoneChange,
);
router.patch(
  "/change-phone/finalize",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  finalizePhoneChange,
);
router.post(
  "/reset-password/initiate",
  optionallyAuthenticate,
  initiatePasswordReset,
);
router.patch(
  "/set-password",
  optionallyAuthenticate,
  autoInvalidateUserCache("SESSIONS_REVOKE_ALL"),
  setPassword,
);

// --- ADMINISTRATIVE & ACCOUNT LIFECYCLE ---
router.patch(
  "/account/status",
  authenticate,
  requireRole([
    COMMUNITY_ROLES.USER,
    PLATFORM_ROLES.ADMIN,
    PLATFORM_ROLES.SUPER_ADMIN,
  ]),
  requirePermission(PERMISSIONS.ADMIN.MANAGE_USERS),
  changeAccountStatus,
);
router.delete(
  "/account/delete",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.USER.DELETE_ACCOUNT),
  autoInvalidateUserCache("CRITICAL_UPDATE"),
  deleteAccount,
);

// --- SOCIAL RELATIONSHIPS ---
// Follow User: Evaluates target user state and social block relationships.
router.post(
  "/:id/follow",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.FOLLOW),
  enforcePolicy(userProfilePolicy, loadUserResource("id")),
  autoInvalidateUserCache("SOCIAL_RELATIONSHIP_UPDATE"),
  followUser,
);

// Get Followers: Validates access permissions and social restrictions for the target user.
router.get(
  "/:id/followers",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.VIEW_FOLLOWERS),
  enforcePolicy(userProfilePolicy, loadUserResource("id")),
  getFollowers,
);

// --- IDENTITY VERIFICATION (KYC) ---
router.patch(
  "/kyc/submit",
  authenticate,
  checkAccountRestriction,
  requireRole([PLATFORM_ROLES.OWNER]),
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  submitKyc,
);
router.patch(
  "/kyc/review",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.KYC.REVIEW),
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  reviewKyc,
);

// --- PREFERENCES & SETTINGS ---
router.get(
  "/settings",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_VIEW),
  getUserSettings,
);

router.patch(
  "/settings/display",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  updateDisplaySettings,
);

router.patch(
  "/settings/notifications",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  updateNotificationSettings,
);

router.patch(
  "/settings/privacy",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  updatePrivacySettings,
);

// --- CONTENT FILTERING & TOPICS ---
router.post(
  "/settings/muted-words",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  addMutedWords,
);

router.delete(
  "/settings/muted-words",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  removeMutedWordsHandler,
);

router.patch(
  "/settings/topic",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  syncUserTopics,
);

router.delete(
  "/settings/topic",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.USER.SETTINGS_MANAGE),
  autoInvalidateUserCache("USER_SETTINGS"),
  removeUserTopics,
);

export default router;
