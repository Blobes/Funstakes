import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import { gistLike } from "./controllers/gistLike";
import { createGist } from "./controllers/createGist";
import { editGist } from "./controllers/editGist";
import { getGist } from "./controllers/getGist";
import { optionallyAuthenticate, authenticate } from "@/envVars";
import { draftGist } from "./controllers/draftGist";
import { autoInvalidatePostCache, autoInvalidateUserCache } from "@repo/shared";
import {
  checkAccountRestriction,
  enforcePolicy,
  gistPolicy,
  loadGistResource,
  requirePermission,
} from "@repo/security";
import { PERMISSIONS } from "@repo/database";

export const gistRouter = () => {
  const router: Router = express.Router();

  // Testing api.funstakes.net/gists/test
  router.get("/test", (_req, res) => {
    res.json({ message: "Welcome to Funstakes Gist API" });
  });

  // Read operations
  router.get("/feed", optionallyAuthenticate, getGistList);

  // View specific gist post with domain policy evaluation
  router.get("/:postId", optionallyAuthenticate, getGist);

  // Mutation operations
  // Create a new gist post
  router.post(
    "/create",
    authenticate,
    checkAccountRestriction,
    requirePermission(PERMISSIONS.POST.CREATE),
    createGist,
  );

  // Create a gist draft
  router.post(
    "/draft",
    authenticate,
    checkAccountRestriction,
    requirePermission(PERMISSIONS.POST.CREATE),
    autoInvalidateUserCache("POST_UPDATE"),
    draftGist,
  );

  // Like a gist post
  router.post(
    "/:postId/like",
    authenticate,
    checkAccountRestriction,
    requirePermission(PERMISSIONS.POST.READ),
    autoInvalidatePostCache({
      postType: "GIST",
      invalidatePostTypeFeed: false,
    }),
    gistLike,
  );

  // Edit a gist post: Requires POST.EDIT permission + ReBAC ownership check
  router.put(
    "/:postId/edit",
    authenticate,
    checkAccountRestriction,
    requirePermission(PERMISSIONS.POST.EDIT),
    enforcePolicy(gistPolicy, loadGistResource("postId")),
    autoInvalidatePostCache({
      postType: "GIST",
      invalidateGlobalFirstPage: true,
    }),
    editGist,
  );

  return router;
};
