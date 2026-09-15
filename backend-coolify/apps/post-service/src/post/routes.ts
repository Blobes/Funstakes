import express, { Router } from "express";
import { markPostAsSeen } from "./markPost/markAsSeen";
import { optionallyAuthenticate, authenticate } from "../envVars";
import { translateCaption } from "./translate/translateCaption";
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

// Sync topics attached to posts
router.post(
  "/topic/sync",
  authenticate,
  requirePermission(PERMISSIONS.TOPIC.SYNC_POST_TOPICS),
  autoInvalidatePostCache({}),
  syncPostTopics,
);

export default router;
