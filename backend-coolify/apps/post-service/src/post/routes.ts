import express, { Router } from "express";
import { markPostAsSeen } from "./markPost/markAsSeen";
import { optionallyAuthenticate, authenticate } from "../envVars";
import { translateCaption } from "./translate/translateCaption";
import { getTopics } from "./topic/get";
import { syncPostTopics } from "./topic/sync";
import { autoInvalidatePostCache } from "@repo/shared";
import { requirePermission } from "@repo/security";
import { PERMISSIONS } from "@repo/database";

const router: Router = express.Router();

// Mark post as seen
router.patch(
  "/:postId/seen",
  optionallyAuthenticate,
  autoInvalidatePostCache({ invalidatePostLanguages: false }),
  markPostAsSeen,
);

// Translate post caption
router.post(
  "/translate/caption",
  authenticate,
  requirePermission(PERMISSIONS.POST.TRANSLATE_CAPTION),
  translateCaption,
);

// Search and lookup available topics
router.post(
  "/topic/search",
  authenticate,
  requirePermission(PERMISSIONS.POST.VIEW_TOPICS),
  getTopics,
);

// Sync topics attached to posts
router.post(
  "/topic/sync",
  authenticate,
  requirePermission(PERMISSIONS.POST.SYNC_TOPICS),
  autoInvalidatePostCache({}),
  syncPostTopics,
);

// router.delete("/topic/cleanup", authenticate, deleteUnusedTopics);

export default router;
