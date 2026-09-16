import express, { Router } from "express";
import { getAllPost } from "./controllers/getAllPost";
import { getUserPosts } from "./controllers/getUserPosts";
import { optionallyAuthenticate, authenticate } from "@/envVars";
import { getUserDraftPosts } from "./controllers/getDraftPosts";
import { getFollowersPosts } from "./controllers/followersPosts";
import {
  checkAccountRestriction,
  enforcePolicy,
  loadUserResource,
  ownerPolicy,
  requirePermission,
  userProfilePolicy,
} from "@repo/security";
import { PERMISSIONS } from "@repo/database";

const router: Router = express.Router();

// Testing api.funstakes.net/feed/test
router.get("/test", (req, res) => {
  res.json({ message: "Welcome to Funstakes Feed API" });
});

// Feed Logic
router.get("/", optionallyAuthenticate, getAllPost);
router.get(
  "/followers",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.POST.READ),
  getFollowersPosts,
);

router.get(
  ":userId/drafts",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.POST.READ),
  enforcePolicy(ownerPolicy, loadUserResource("userId")),
  getUserDraftPosts,
);

router.get(
  "/:userId",
  authenticate,
  checkAccountRestriction,
  requirePermission(PERMISSIONS.POST.READ),
  enforcePolicy(userProfilePolicy, loadUserResource("id")),
  getUserPosts,
);

export default router;
