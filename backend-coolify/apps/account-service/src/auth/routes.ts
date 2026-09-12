import express, { Router } from "express";
import { checkEmail } from "./check/controllers/email";
import { checkUsername } from "./check/controllers/username";
import { createAccount } from "./registration/controllers/createAccount";
import { verifyMsgOtp } from "./verification/messaging/controllers/verifyOtp";
import { sendMsgCode } from "./verification/messaging/controllers/sendOtp";
import { loginUser } from "./session/controllers/login";
import { verifySession } from "./session/controllers/verifySession";
import { logoutUser } from "./session/controllers/logout";
import { setPrimaryDevice } from "./device/primaryDevice";
import { checkPhone } from "./check/controllers/phone";
import { refreshSession } from "./session/controllers/refreshSession";
import { getDevices } from "./device/getAllDevices";
import { removeDevice } from "./device/removeDevice";
import { authenticate, optionallyAuthenticate } from "@/envVars";
import { updateOnboarding } from "./registration/controllers/onboarding";
import { oauthExchange } from "./oauth/oauthExchange";
import { verifyTotpCode } from "./verification/totp/controller/verify";
import { setupTotp } from "./verification/totp/controller/setup";
import { autoInvalidateUserCache } from "@repo/shared";
import { turnstileVerification } from "./turnstile/controller";
import { commitAccountUpdate } from "./verification/messaging/controllers/commitUpdate";
import {
  enforcePolicy,
  requirePermission,
  devicePolicy,
  loadDeviceResource,
} from "@repo/security";
import { PERMISSIONS } from "@repo/database";
import { checkWhatsAppStatus } from "./verification/whatsapp/checkStatus";
import { resetMessagingOtp } from "./verification/messaging/controllers/resetOtp";
import { verifySecurityQuestions } from "./verification/security-questions/controller/verify";
import { setupSecurityQuestions } from "./verification/security-questions/controller/setup";
import { fetchSecurityQuestions } from "./verification/security-questions/controller/fetch";

const router: Router = express.Router();

// Health check endpoint for auth service.
router.get("/", (_req, res) => {
  res.json({ message: "Welcome to Funstakes Auth API" });
});

// --- DISCOVERY & AVAILABILITY ---
router.post("/check/email", checkEmail);
router.post("/check/phone", checkPhone);
router.post("/check/username", checkUsername);

// --- REGISTRATION & ACCOUNT ONBOARDING ---
router.post("/signup", createAccount);
router.post(
  "/onboarding",
  authenticate,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  updateOnboarding,
);

// --- OAUTH ---
router.post(
  "/oauth-exchange",
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  oauthExchange,
);

// --- SESSION MANAGEMENT ---
router.post(
  "/session/login",
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  loginUser,
);
router.post("/session/refresh", refreshSession);
router.post(
  "/session/logout",
  authenticate,
  autoInvalidateUserCache("SESSIONS_REVOKE_ALL"),
  logoutUser,
);
router.get("/session/verify", authenticate, verifySession);

// --- VERIFICATION & MFA ---
router.post("/otp/send", sendMsgCode);
router.post("/otp/verify", verifyMsgOtp);
router.post("/otp/reset", resetMessagingOtp);
router.patch("/otp/update-account", commitAccountUpdate);
router.post("/totp/setup", optionallyAuthenticate, setupTotp);
router.post("/totp/verify", optionallyAuthenticate, verifyTotpCode);
router.post(
  "/security-questions/setup",
  optionallyAuthenticate,
  setupSecurityQuestions,
);
router.get("/security-questions/:identifier", fetchSecurityQuestions);
router.post(
  "/security-questions/verify",
  optionallyAuthenticate,
  verifySecurityQuestions,
);
router.get("/whatsapp-status/:phoneNumber", checkWhatsAppStatus);

// --- DEVICE MANAGEMENT ---
router.get(
  "/devices",
  authenticate,
  requirePermission(PERMISSIONS.DEVICE.READ),
  getDevices,
);
/**
 * Deletes a registered user device.
 * Requires DEVICE.DELETE permission + ReBAC ownership/admin check.
 */

router.delete(
  "/devices/:id",
  authenticate,
  requirePermission(PERMISSIONS.DEVICE.DELETE),
  enforcePolicy(devicePolicy, loadDeviceResource("id")),
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  removeDevice,
);

/**
 * Marks a specific device as primary.
 * Requires DEVICE.SET_PRIMARY permission + ReBAC ownership/admin check.
 */
router.patch(
  "/devices/:id/primary",
  authenticate,
  requirePermission(PERMISSIONS.DEVICE.SET_PRIMARY),
  enforcePolicy(devicePolicy, loadDeviceResource("id")),
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  setPrimaryDevice,
);

// --- BOT VERIFICATION ---
router.post("/verify-bot", authenticate, turnstileVerification);

export default router;
