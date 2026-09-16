import express, { Router } from "express";
import { authenticate } from "../envVars";
import {
  checkAccountRestriction,
  requirePermission,
  requireRole,
} from "@repo/security";
import { PERMISSIONS, PLATFORM_ROLES } from "@repo/database";
import { getTopics } from "./get";
import { removeUnusedTopics } from "./delete";
import { getAiSuggestedTopics } from "./aiSuggestions/getTopics";
import { submitAiSuggestedTopics } from "./aiSuggestions/submitTopics";
import { resolveAiSuggestedTopics } from "./aiSuggestions/resolveTopics";
import { removeAiSuggestedTopics } from "./aiSuggestions/removeTopics";
import { createNewTopics } from "./create";

const router: Router = express.Router();

// Search and lookup available topics
router.post(
  "/search",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.TOPIC.VIEW_ALL),
  getTopics,
);

// Remove unsused topics
router.delete(
  "/cleanup",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.TOPIC.REMOVE),
  removeUnusedTopics,
);

// Bulk create missing topics
router.post(
  "/create",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.TOPIC.CREATE),
  createNewTopics,
);

// Search and list AI suggested topics
router.get(
  "/ai-topics",
  authenticate,
  requirePermission(PERMISSIONS.TOPIC.VIEW_ALL),
  getAiSuggestedTopics,
);

// Submit new AI suggested topics
router.post(
  "/ai-topics/submit",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.TOPIC.CREATE),
  submitAiSuggestedTopics,
);

// Resolve AI suggested topics (Accept or Decline)
router.patch(
  "/ai-topics/resolve",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.TOPIC.RESOLVE),
  resolveAiSuggestedTopics,
);

// Delete AI suggested topics
router.delete(
  "/ai-topics",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(PERMISSIONS.TOPIC.REMOVE),
  removeAiSuggestedTopics,
);

export default router;
