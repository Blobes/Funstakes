import { Router } from "express";
import { authenticate } from "@/envVars";
import { reportCase } from "./reportCase";
import { resolveCase } from "./resolveCase";
import {
  COMMUNITY_ROLES,
  PERMISSIONS,
  PLATFORM_ROLES,
  REPORT_PERMISSIONS,
  UserLogModel,
} from "@repo/database";
import {
  auditAction,
  checkAccountRestriction,
  requirePermission,
  requireRole,
} from "@repo/security";

const router: Router = Router();

router.get(
  "/report-case",
  authenticate,
  checkAccountRestriction,
  requireRole([COMMUNITY_ROLES.USER]),
  requirePermission(REPORT_PERMISSIONS.ESCALATE),
  auditAction({
    UserLogModel,
    action: "Reported Case",
    category: "MODERATION",
  }),
  reportCase,
);
router.get(
  "/resolve-case",
  authenticate,
  requireRole([PLATFORM_ROLES.ADMIN, PLATFORM_ROLES.SUPER_ADMIN]),
  requirePermission(REPORT_PERMISSIONS.RESOLVE),
  resolveCase,
);

export default router;
