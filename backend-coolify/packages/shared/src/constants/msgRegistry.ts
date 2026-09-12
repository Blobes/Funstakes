import { OtpMessageChannel, TransInfo } from "../types/general";
import { PostModelType, RoleName } from "@repo/database";

type RegistryValue = TransInfo | ((...args: any[]) => TransInfo);
type RegistryStructure = {
  [category: string]: {
    [key: string]: RegistryValue;
  };
};

/**
 * Unified application translation dictionary mapping strict translation keys to their unique messages.
 */
export const MESSAGES_REGISTRY = {
  ADMIN: {
    CONTENT_RESOLUTION_SUCCESS: (resolution: string): TransInfo => ({
      i18nKey: "admin.content_resolution_success",
      message: "Content {{resolution}}. Reports purged.",
      interpolations: { resolution },
    }),
    MODERATION_RECORD_NOT_FOUND: {
      i18nKey: "admin.moderation_record_not_found",
      message: "Moderation record not found.",
    },
    MODERATION_CASE_RESOLVED: {
      i18nKey: "admin.moderation_case_resolved",
      message: "Moderation case resolved successfully",
    },
    MODERATION_RESOLUTION_THROWN_ERROR: (message: string) => ({
      i18nKey: "admin.moderation_resolution_thrown_error",
      message: "Moderation resolution failed: {{message}}",
      interpolations: { message },
    }),
    MODERATION_RESOLUTION_FALLBACK_ERROR: {
      i18nKey: "admin.moderation_resolution_fallback_error",
      message: "An error occurred while resolving the moderation case",
    },

    MODERATION_DATA_ALREADY_REPORTED: (dataType: string) => ({
      i18nKey: "admin.moderation_data_already_reported",
      message:
        "This {{dataType}} data has already been reported by your profile.",
      interpolations: { dataType },
    }),
    MODERATION_DATA_SOURCE_NOT_FOUND: {
      i18nKey: "admin.moderation_data_source_not_found",
      message:
        "The requested moderation data source could not be found or has been removed.",
    },
    MODERATION_DATA_BANNED: (dataType: string) => ({
      i18nKey: "admin.moderation_data_banned",
      message:
        "Moderation {{dataType}} data has been automatically banned due to repeated policy infractions, and profile penalties have been enforced.",
      interpolations: { dataType },
    }),
    MODERATION_DATA_PLACED_UNDER_REVIEW: {
      i18nKey: "admin.moderation_data_placed_under_review",
      message:
        "The moderation data safety threshold has been exceeded. Data content has been placed under review.",
    },
    MODERATION_REPORT_RECEIVED: {
      i18nKey: "admin.moderation_report_received",
      message:
        "Report successfully received and filed in the moderation queue.",
    },
    MODERATION_AUTOMATED_SUSPENSION_REASON: (caseCount: number) => ({
      i18nKey: "admin.moderation_automated_suspension_reason",
      message:
        "Automated account suspension triggered following {{caseCount}} verified data/content moderation safety cases.",
      interpolations: { caseCount },
    }),
    MODERATION_FLAGGING_SYNC_THROWN_ERROR: (reason: string) => ({
      i18nKey: "admin.moderation_flagging_sync_thrown_error",
      message:
        "Moderation data content flagging pipeline encountered an operational fault: {{reason}}",
      interpolations: { reason },
    }),
    MODERATION_FLAGGING_SYNC_FALLBACK_ERROR: {
      i18nKey: "admin.moderation_flagging_sync_fallback_error",
      message:
        "Content flagging pipeline encountered an unexpected internal error.",
    },

    RESOLUTION_FAILED: {
      i18nKey: "admin.resolution_failed",
      message: "Resolution failed.",
    },
    REVIEW_PROCESSING_FAILED: {
      i18nKey: "admin.review_processing_failed",
      message: "Failed to process review.",
    },
    REVIEW_REQUEST_NOT_FOUND: {
      i18nKey: "admin.review_request_not_found",
      message: "Request not found.",
    },
    VERIFICATION_REVIEW_SUCCESS: (decision: string): TransInfo => ({
      i18nKey: "admin.verification_review_success",
      message: "User verification has been {{decision}}.",
      interpolations: { decision },
    }),
    WELCOME_MESSAGE: {
      i18nKey: "admin.welcome_message",
      message: "Welcome to Funstakes Admin Service API",
    },
  },

  AUTH: {
    ACCOUNT_ACTIVE: {
      i18nKey: "auth.account_active",
      message: "Account is currently active",
    },
    ACCOUNT_DEACTIVATED: {
      i18nKey: "auth.account_deactivated",
      message: "This account is deactivated. Please restore it to continue.",
    },
    ACCOUNT_ALREADY_DEACTIVATED: {
      i18nKey: "auth.account_already_deactivated",
      message: "Account is already deactivated",
    },
    ACCOUNT_BANNED: {
      i18nKey: "auth.account_banned",
      message:
        "This account has been banned for severely violating our commnunity policies",
    },
    ACCOUNT_FOUND: {
      i18nKey: "auth.account_found",
      message: "Account found with provided identifier",
    },
    ACCOUNT_INACTIVE: {
      i18nKey: "auth.account_inactive",
      message: "Account is currently not active",
    },
    ACCOUNT_RECORDS_UPDATED: {
      i18nKey: "auth.account_records_cleared_updated",
      message: "Account records and status updated successfully.",
    },
    ACCOUNT_ALREADY_IN_STATUS: {
      i18nKey: "auth.account_already_in_status",
      message: "Account is already in the requested status.",
    },
    ACCOUNT_RECORDS_CLEARED: {
      i18nKey: "auth.account_records_cleared",
      message: "Account records successfully cleared.",
    },
    ACCOUNT_DELETED_SUCCESSFULLY: {
      i18nKey: "auth.account_deleted_successfully",
      message: "Account permanently deleted successfully",
    },
    ACCOUNT_DELETION_THROWN_ERROR: (message: string) => ({
      i18nKey: "auth.account_deletion_thrown_error",
      message: "Account permanent deletion failed: {{message}}",
      interpolations: { message },
    }),
    ACCOUNT_DELETION_FALLBACK_ERROR: {
      i18nKey: "auth.account_deletion_fallback_error",
      message: "An error occurred during permanent account deletion",
    },
    ACCOUNT_RESTORE_FALLBACK_ERROR: {
      i18nKey: "auth.account_restore_fallback_error",
      message: "Failed to restore account.",
    },
    ACCOUNT_RESTORE_THROWN_ERROR: (message: string) => ({
      i18nKey: "auth.account_restore_thrown_error",
      message: "{{message}}",
      interpolations: { message },
    }),
    ACCOUNT_DEACTIVATED_SELF: {
      i18nKey: "auth.account_deactivated_self",
      message: "You have successfully deactivated your account.",
    },
    ACCOUNT_DEACTIVATED_ADMIN: {
      i18nKey: "auth.account_deactivated_admin",
      message: "User account deactivated by you as an administrator.",
    },
    AUTH_REQUIRED: {
      i18nKey: "auth.auth_required",
      message: "Authentication required",
    },
    ACCOUNT_SUSPENDED: {
      i18nKey: "auth.account_suspended",
      message:
        "This account is suspended for violating our terms of use. If you are the owner you can appeal to restore it.",
    },
    EMAIL_ALREADY_REGISTERED: {
      i18nKey: "auth.account_registered",
      message: "Email is already registered.",
    },
    EMAIL_AVAILABLE: {
      i18nKey: "auth.email_available",
      message: "Email is available.",
    },
    EMAIL_NOT_FOUND: {
      i18nKey: "auth.email_not_found",
      message: "Account not found with email address.",
    },
    EMAIL_REQUIRED: {
      i18nKey: "auth.email_required",
      message: "Email address is required.",
    },
    EMAIL_OR_PHONE_REQUIRED: {
      i18nKey: "auth.email_or_phone_required",
      message: "An email address or phone number is required.",
    },
    INVALID_EMAIL_OR_PHONE: {
      i18nKey: "auth.invalid_email_or_phone",
      message: "Invalid email or phone number.",
    },
    NOT_SIGNED_UP_WITH_EMAIL: (provider: string): TransInfo => ({
      i18nKey: "auth.not_signed_up_with_email",
      message:
        "This account was created using {{provider}}. Please log in with {{provider}} or request a password reset to set a local password.",
      interpolations: { provider },
    }),
    PHONE_AVAILABLE: {
      i18nKey: "auth.phone_available",
      message: "Phone number is available.",
    },
    PHONE_NOT_FOUND: {
      i18nKey: "auth.phone_not_found",
      message: "Account not found with phone number.",
    },
    PHONE_REGISTERED: {
      i18nKey: "auth.phone_registered",
      message: "Phone number is already in use.",
    },
    PHONE_REQUIRED: {
      i18nKey: "auth.phone_required",
      message: "Phone number is required.",
    },
    USERNAME_ACTIVE: {
      i18nKey: "auth.username_active",
      message: "Username exists and is active.",
    },
    USERNAME_AVAILABLE: {
      i18nKey: "auth.username_available",
      message: "Username is available.",
    },
    USERNAME_INACTIVE: {
      i18nKey: "auth.username_inactive",
      message: "Username exists but not really active.",
    },
    USERNAME_NOT_FOUND: {
      i18nKey: "auth.username_not_found",
      message: "Username not found.",
    },
    USERNAME_REQUIRED: {
      i18nKey: "auth.username_required",
      message: "Username is required.",
    },
    USERNAME_TAKEN: {
      i18nKey: "auth.username_taken",
      message: "Username is already taken.",
    },

    UPDATE_CANCELLATION_FALLBACK_ERROR: {
      i18nKey: "auth.update_cancellation_fallback_error",
      message: "Server error during cancellation.",
    },
    UPDATE_CANCELLATION_THROWN_ERROR: (message: string) => ({
      i18nKey: "auth.update_cancellation_thrown_error",
      message: "{{message}}",
      interpolations: { message },
    }),
    CODE_EXPIRED: {
      i18nKey: "auth.code_expired",
      message: "Verification code has expired.",
    },
    CODE_REQUIRED: {
      i18nKey: "auth.code_required",
      message: "Verification code is required.",
    },
    CODE_RECIPIENT_PURPOSE_REQUIRED: {
      i18nKey: "auth.code_recipient_purpose_required",
      message: "Verification code, recipient and purpose is required.",
    },
    OTP_CHANNEL_REQUIRED: {
      i18nKey: "auth.otp_channel_required",
      message: "Otp dispatch channel is required.",
    },
    COOLDOWN_ACTIVE: (daysRemaining: number | string): TransInfo => ({
      i18nKey: "auth.cooldown_active",
      message:
        "You can only change this information once every 90 days. Please wait {{daysRemaining}} more days.",
      interpolations: { daysRemaining },
    }),
    CURRENT_PASSWORD_REQUIRED: {
      i18nKey: "auth.current_password_required",
      message: "Current password is required to change password settings.",
    },
    DEACTIVATED_NOT_FOUND: {
      i18nKey: "auth.deactivated_not_found",
      message: "No deactivated account found or grace period has expired.",
    },
    DEACTIVATION_FALLBACK_ERROR: {
      i18nKey: "auth.deactivation_fallback_error",
      message: "Failed to deactivate account.",
    },
    DEACTIVATION_THROWN_ERROR: (message: string): TransInfo => ({
      i18nKey: "auth.deactivation_thrown_error",
      message: "{{message}}",
      interpolations: { message },
    }),
    ACCOUNT_STATUS_THROWN_ERROR: (message: string) => ({
      i18nKey: "auth.account_status_thrown_error",
      message: "Account status transition failed: {{message}}",
      interpolations: { message },
    }),
    ACCOUNT_STATUS_FALLBACK_ERROR: (status: string) => ({
      i18nKey: "auth.account_status_fallback_error",
      message:
        "An error occurred while updating the account status to: {{status}}",
      interpolations: { status },
    }),
    DEVICES_RETRIEVED: {
      i18nKey: "auth.devices_retrieved",
      message: "Device(s) retrieved successfully.",
    },
    DEVICE_REMOVED: {
      i18nKey: "auth.device_removed",
      message: "Device removed successfully.",
    },
    DEVICE_TRUST_EXPIRED: {
      i18nKey: "auth.device_trust_expired",
      message:
        "Device trust has expired or hardware unknown. Verification required.",
    },
    DEVICE_SESSION_TERMINATED: {
      i18nKey: "auth.device_session_terminated",
      message:
        "Device removed and all related sessions terminated successfully.",
    },
    DUPLICATE_SECURITY_QUESTIONS: {
      i18nKey: "auth.duplicate_security_questions",
      message: "Please select three unique security questions.",
    },
    EMAIL_CHANGE_CANCELLED: {
      i18nKey: "auth.email_change_cancelled",
      message:
        "Email change process cancelled. Your current email remains active.",
    },
    EMAIL_ALREADY_USED: {
      i18nKey: "auth.email_already_used",
      message: "You are already using this email.",
    },
    EMAIL_CONFLICT: {
      i18nKey: "auth.email_conflict",
      message: "Email is already in use or reserved by a deactivated account.",
    },
    EMAIL_PASSWORD_REQUIRED: {
      i18nKey: "auth.email_password_required",
      message: "Email and password fields are required.",
    },
    EMAIL_UPDATED_SESSIONS_ENDED: {
      i18nKey: "auth.email_updated_sessions_ended",
      message:
        "Email updated successfully. Other devices have been logged out.",
    },
    FORBIDDEN: {
      i18nKey: "auth.forbidden",
      message: "You don't have permission to perform this action.",
    },
    HARDWARE_ID_MISMATCH: {
      i18nKey: "auth.hardware_id_mismatch",
      message: "Hardware identity mismatch",
    },
    INCORRECT_CURRENT_PASSWORD: {
      i18nKey: "auth.incorrect_current_password",
      message: "The current password you entered is incorrect.",
    },
    INVALID_OTP_CODE: {
      i18nKey: "auth.invalid_otp_code",
      message: "Invalid otp verification code.",
    },
    INVALID_OTP_CHANNEL: {
      i18nKey: "auth.invalid_otp_channel",
      message: "Invalid otp dispatch channel.",
    },
    INVALID_EMAIL: {
      i18nKey: "auth.invalid_email",
      message: "Invalid email format.",
    },
    INVALID_ID_FORMAT: {
      i18nKey: "auth.invalid_id_format",
      message: "Invalid user ID format.",
    },
    INVALID_NEW_PASSWORD: {
      i18nKey: "auth.invalid_new_password",
      message:
        "New password is required and must be at least 6 characters long.",
    },
    INVALID_SESSION_MAPPING: {
      i18nKey: "auth.invalid_session_mapping",
      message: "Invalid session mapping",
    },
    INVALID_SESSION: {
      i18nKey: "auth.invalid_session",
      message: "Invalid or expired session context",
    },
    INVALID_OAUTH_TOKEN: {
      i18nKey: "auth.invalid_oauth_token",
      message: "The provided identity token could not be verified.",
    },
    INVALID_TOKEN: {
      i18nKey: "auth.invalid_token",
      message: "Invalid or expired token",
    },
    INVALID_PHONE: {
      i18nKey: "auth.invalid_phone",
      message:
        "Invalid phone number format. Please use E.164 format (e.g., +234...).",
    },
    INVALID_OTP_DISPATCH_PURPOSE: {
      i18nKey: "auth.invalid_otp_dispatch_purpose",
      message: "A valid otp dispatch purpose is required.",
    },
    INVALID_OTP_VERIFICATION_PURPOSE: {
      i18nKey: "auth.invalid__otp_verification_purpose",
      message: "A valid otp verification purpose is required.",
    },
    INVALID_PASSWORD_PURPOSE: {
      i18nKey: "auth.invalid_password_purpose",
      message: "A valid password reset purpose is required.",
    },
    LOGGED_IN_SUCCESSFULLY: {
      i18nKey: "auth.logged_in_successfully",
      message: "Logged in successfully.",
    },
    LOGGED_IN_SUCCESSFULLY_VIA_OAUTH: (provider: string): TransInfo => ({
      i18nKey: "auth.logged_in_successfully_via_oauth",
      message: "Logged in successfully via {{provider}}.",
      interpolations: { provider },
    }),
    LOGGED_OUT_OF_ALL_DEVICES_SUCCESSFULLY: {
      i18nKey: "auth.logged_out_of_all_devices_successfully",
      message: "Successfully logged out of all devices.",
    },
    MFA_ALREADY_ENABLED: {
      i18nKey: "auth.mfa_already_enabled",
      message: "MFA is already enabled",
    },
    MFA_ENABLED: {
      i18nKey: "auth.mfa_enabled",
      message: "MFA successfully enabled",
    },
    MFA_ALREADY_DISABLED: {
      i18nKey: "auth.mfa_already_disabled",
      message: "MFA is already disabled",
    },
    MFA_DISABLED: {
      i18nKey: "auth.mfa_disabled",
      message: "MFA successfully disabled",
    },
    MISSING_TOKENS: {
      i18nKey: "auth.missing_tokens",
      message: "Provider, idToken, and deviceToken are required parameters.",
    },
    MISSING_REQUIRED_FIELDS: {
      i18nKey: "auth.security_questions.missing_required_fields",
      message:
        "Please enter your account details and provide all required security answers.",
    },
    NO_ACTIVE_PROCESS: {
      i18nKey: "auth.no_active_process",
      message: "No active verification process found.",
    },
    NO_AUTH_TOKEN: {
      i18nKey: "auth.no_auth_token",
      message: "No token provided",
    },
    NO_PASSWORD_SET: {
      i18nKey: "auth.no_password_set",
      message: "This account does not have a password. Please set a password.",
    },
    NO_PENDING_CHANNEL_CHANGE: (channel: string): TransInfo => ({
      i18nKey: "auth.logged_in_successfully_via_oauth",
      message:
        "No pending {{channel}} change found. Initiate a {{channel}} update request first.",
      interpolations: { provider: channel },
    }),
    NO_PENDING_EMAIL_CHANGE: {
      i18nKey: "auth.no_pending_email_change",
      message: "No pending email change found.",
    },
    NO_PENDING_PHONE_CHANGE: {
      i18nKey: "auth.no_pending_phone_change",
      message: "No pending phone change request found.",
    },
    NO_REFRESH_TOKEN: {
      i18nKey: "auth.no_auth_token",
      message: "No refresh token",
    },
    OTP_EMAIL_DISPATCH_FAILED: (
      provider: string,
      errorName: string,
      errorMsg: string,
    ) => ({
      i18nKey: "auth.otp_email_dispatch_failed",
      message:
        "Email OTP dispatch from ({{provider}}) failed: {{errorName} - ${errorMsg}",
      interpolations: { provider, errorName, errorMsg },
    }),
    OTP_EMAIL_DISPATCH_MISSING_ID: (provider: string) => ({
      i18nKey: "auth.otp_email_dispatch_missing_id",
      message: "{{provider}} response missing dispatch email ID",
      interpolations: { provider },
    }),
    OTP_EMAIL_DISPATCH_FALLBACK_FAILED: {
      i18nKey: "auth.otp_email_dispatch_fallback_failed",
      message:
        "Email dispatch failed completely: Resend failed and SMTP configuration is incomplete.",
    },

    OTP_VERIFIED_SUCCESSFULLY: {
      i18nKey: "auth.otp_verified_successfully",
      message: "Verified successfully.",
    },
    OTP_PHONE_REGION_NOT_SUPPORTED: {
      i18nKey: "auth.otp_phone_region_not_supported",
      message:
        "Phone number country code is not currently supported for SMS OTP delivery.",
    },
    OTP_WHATSAPP_CONFIG_INVALID: {
      i18nKey: "auth.otp_whatsapp_config_invalid",
      message: "WhatsApp provider configuration tokens are missing or invalid.",
    },
    OTP_LOCAL_SMS_CONFIG_INVALID: {
      i18nKey: "auth.otp_local_sms_config_invalid",
      message:
        "Local SMS provider configuration tokens are missing or invalid.",
    },
    OTP_GLOBAL_SMS_CONFIG_INVALID: {
      i18nKey: "auth.otp_global_sms_config_invalid",
      message:
        "Global SMS provider configuration tokens are missing or invalid.",
    },
    OTP_WHATSAPP_DISPATCH_FAILED: (detail?: string) => ({
      i18nKey: "auth.otp_whatsapp_dispatch_failed",
      message: detail
        ? "WhatsApp API dispatch failed: {{detail}}"
        : "WhatsApp API dispatch failed.",
      interpolations: { detail },
    }),
    OTP_LOCAL_SMS_DISPATCH_FAILED: (detail?: string) => ({
      i18nKey: "auth.otp_local_sms_dispatch_failed",
      message: detail
        ? "Local SMS dispatch failed: {{detail}}"
        : "Local SMS dispatch failed.",
      interpolations: { detail },
    }),
    OTP_LOCAL_SMS_TIMEOUT: (duration: number = 45) => ({
      i18nKey: "auth.otp_local_sms_timeout",
      message:
        "Local SMS dispatch request timed out after {{duration}} seconds.",
      interpolations: { duration },
    }),
    OTP_GLOBAL_SMS_DISPATCH_FAILED: (detail?: string) => ({
      i18nKey: "auth.otp_global_sms_dispatch_failed",
      message: detail
        ? "Global SMS dispatch failed: {{detail}}"
        : "Global SMS dispatch failed.",
      interpolations: { detail },
    }),
    OTP_RESET_SUCCESS: {
      i18nKey: "auth.otp_reset_success",
      message: "Otp has been restored back to default.",
    },
    PHONE_OTP_LIMIT_EXCEEDED: (duration: number): TransInfo => ({
      i18nKey: "auth.phone_otp_limit_exceeded",
      message:
        "Too many verification requests for this number. Please wait {{duration}} minutes to dispatch via phone number or you can use an alternative dispatch method.",
      interpolations: { duration },
    }),
    OAUTH_PROVIDER_CONFLICT: (provider: string): TransInfo => ({
      i18nKey: "auth.oauth_provider_conflict",
      message:
        "This account is already linked with {{provider}}. Please log in using that method.",
      interpolations: { provider },
    }),
    PASSWORD_RESET_INITIATED: {
      i18nKey: "auth.password_reset_initiated",
      message: "Password reset initiated. You will be redirected shortly.",
    },
    PASSWORD_RESET_INITIATED_VIA_MESSAGING: (channel: OtpMessageChannel) => ({
      i18nKey: "auth.password_reset_initiated_via_messaging",
      message:
        "Password reset initiated. A verification code will be sent to your {{channel}} inbox shortly.",
      interpolations: { channel },
    }),
    PASSWORD_ALREADY_EXISTS: {
      i18nKey: "auth.password_already_exists",
      message:
        "This account already has a password set. Use the change password option instead.",
    },
    PASSWORD_CHANGED_SESSIONS_ENDED: {
      i18nKey: "auth.password_changed_sessions_ended",
      message:
        "Password changed. Secondary device sessions ended for security.",
    },
    PASSWORD_CHANGED_SUCCESSFULLY: {
      i18nKey: "auth.password_changed_successfully",
      message:
        "Password changed successfully. All other devices have been logged out.",
    },
    PASSWORD_REQUIRED: {
      i18nKey: "auth.password_required",
      message: "Please provide your password to confirm identity.",
    },
    PASSWORD_REUSE_FORBIDDEN: {
      i18nKey: "auth.password_reuse_forbidden",
      message: "New password cannot be the same as your current password.",
    },
    PASSWORD_UPDATE_ERROR: {
      i18nKey: "auth.password_update_error",
      message: "Failed to update password due to server error.",
    },
    PHONE_CONFLICT: {
      i18nKey: "auth.phone_conflict",
      message: "This phone number is already linked to another account.",
    },
    PHONE_ALREADY_USED: {
      i18nKey: "auth.phone_already_used",
      message: "You are already using this phone number.",
    },
    PHONE_VERIFIED_SESSIONS_ENDED: {
      i18nKey: "auth.phone_verified_sessions_ended",
      message: "Phone number verified. Other sessions have been terminated.",
    },
    PHONE_UPDATE_ERROR: {
      i18nKey: "auth.phone_update_error",
      message: "Failed to initiate phone number change.",
    },
    PHONE_VERIFICATION_ERROR: {
      i18nKey: "auth.phone_verification_error",
      message: "An error occurred during verification.",
    },
    PRIMARY_DEVICE_UPDATED: {
      i18nKey: "auth.primary_device_updated",
      message: "Primary device updated successfully.",
    },
    DEVICE_NOT_FOUND: {
      i18nKey: "auth.device_not_found",
      message: "Device not found.",
    },
    RATE_LIMIT_ACTIVE: (secondsToWait: number | string): TransInfo => ({
      i18nKey: "auth.rate_limit_active",
      message:
        "Please wait {{secondsToWait}} seconds before requesting another code.",
      interpolations: { secondsToWait },
    }),
    RECORD_ALREADY_EXISTS: (fieldName: string): TransInfo => ({
      i18nKey: "auth.record_already_exists",
      message: "Conflict: {{fieldName}} already exists.",
      interpolations: { fieldName },
    }),
    REGISTRATION_SUCCESSFUL: {
      i18nKey: "auth.registration_successful",
      message: "Registration successful. Verification code sent to email.",
    },
    REGISTRATION_SUCCESSFUL_VIA_OAUTH: (provider: string): TransInfo => ({
      i18nKey: "auth.registration_successful_via_oauth",
      message: "Registration successful via {{provider}}.",
      interpolations: { provider },
    }),
    SECURITY_ANCHOR_ROTATED: {
      i18nKey: "auth.security_anchor_rotated",
      message: "Security anchor rotated. Please log in again.",
    },
    SECURITY_QUESTIONS_FETCHED: {
      i18nKey: "auth.security_questions_fetched",
      message: "Security questions fetched successfully.",
    },
    SECURITY_QUESTIONS_EXACT_THREE_REQUIRED: {
      i18nKey: "auth.security_questions.exact_three_required",
      message:
        "Please select and answer exactly 3 security questions to complete setup.",
    },
    INVALID_SECURITY_QUESTION_INPUT: {
      i18nKey: "auth.security_questions.invalid_input",
      message: "Each security question and answer must be filled out.",
    },
    SECURITY_QUESTIONS_SETUP_SUCCESS: {
      i18nKey: "auth.security_questions.setup_success",
      message: "Security questions saved successfully.",
    },
    SECURITY_QUESTIONS_NOT_CONFIGURED: {
      i18nKey: "auth.security_questions.not_configured",
      message: "Security questions are not set up on this account.",
    },
    SECURITY_QUESTIONS_MISMATCH: {
      i18nKey: "auth.security_questions.mismatch",
      message:
        "One or more answers are incorrect. Please check your responses and try again.",
    },
    SECURITY_QUESTIONS_VERIFIED_SUCCESS: {
      i18nKey: "auth.security_questions.verified_success",
      message: "Security questions verified successfully.",
    },
    SERVER_FALLBACK_ERROR: {
      i18nKey: "auth.server_fallback_error",
      message: "An unexpected error occurred on the server.",
    },
    TURNSTILE_TOKEN_MISSING: {
      i18nKey: "auth.turnstile_token_missing",
      message: "Verification token is required.",
    },
    TURNSTILE_CONFIG_INVALID: {
      i18nKey: "auth.turnstile_config_invalid",
      message: "Verification service configuration error.",
    },
    TURNSTILE_VERIFICATION_FAILED: {
      i18nKey: "auth.turnstile_verification_failed",
      message: "Verification failed or token has expired.",
    },
    TURNSTILE_VERIFICATION_SUCCESS: {
      i18nKey: "auth.turnstile_verification_success",
      message: "Verification completed successfully.",
    },
    UNKNOWN_SERVER_ERROR: (message: string): TransInfo => ({
      i18nKey: "auth.unknown_server_error",
      message: "{{message}}",
      interpolations: { message },
    }),
    SESSIONS_EXPIRED: {
      i18nKey: "auth.sessions_expired",
      message: "Session expired, revoked, or hardware mismatch.",
    },
    SESSIONS_RETRIEVED: {
      i18nKey: "auth.sessions_retrieved",
      message: "Active sessions retrieved.",
    },
    SESSION_REFRESHED: {
      i18nKey: "auth.session_refreshed",
      message: "Session refreshed.",
    },
    SESSION_VALID: {
      i18nKey: "auth.session_valid",
      message: "Session is valid.",
    },
    SUSPICIOUS_ACTIVITY: {
      i18nKey: "auth.suspicious_activity",
      message:
        "Suspicious activity detected from your IP address. Please try again later.",
    },
    TOTP_NOT_ENABLED: {
      i18nKey: "auth.totp_not_enabled",
      message:
        "Authenticator verification is not active on this profile. Please authenticate using the alternative OTP method.",
    },
    TOTP_RETRIEVAL_SUCCESS: {
      i18nKey: "auth.totp_retrieval_success",
      message: "Authenticator app session retrieved successfully.",
    },
    TOTP_SETUP_SUCCESS: {
      i18nKey: "auth.totp_setup_success",
      message: "Authenticator app configuration initialized successfully.",
    },
    TOTP_SETUP_FINALIZED: {
      i18nKey: "auth.totp_setup_finalized",
      message:
        "OTP Authenticator app configuration verified and enabled natively.",
    },
    TOTP_VERIFICATION_SUCCESS: {
      i18nKey: "auth.totp_verification_success",
      message: "Identity verified successfully.",
    },
    TOTP_RECOVERY_SUCCESS: {
      i18nKey: "auth.totp_recovery_success",
      message: "Identity validated successfully via recovery token fallback.",
    },
    MISSING_TOKEN: {
      i18nKey: "auth.missing_token",
      message: "A verification token is required to proceed.",
    },
    INVALID_LIFECYCLE_SEQUENCE: {
      i18nKey: "auth.invalid_lifecycle_sequence",
      message:
        "Invalid activation sequence. Please restart the authenticator setup.",
    },
    UNAUTHORIZED: {
      i18nKey: "auth.unauthorized",
      message: "Unauthorized access.",
    },
    UNSUPPORTED_OAUTH_PROVIDER: {
      i18nKey: "auth.unsupported_oauth_provider",
      message: "The OAuth provider is not supported.",
    },
    USER_NOT_FOUND: {
      i18nKey: "auth.user_not_found",
      message: "User not found or deactivated",
    },
    MISSING_IDENTIFER: {
      i18nKey: "auth.user_id_required",
      message: "User identifier is required for account update",
    },
    VERIFICATION_CODE_SENT_TO_EMAIL: {
      i18nKey: "auth.verification_code_sent_to_email",
      message: "A verification code has been sent to your email address.",
    },
    VERIFICATION_CODE_SENT_TO_PHONE: {
      i18nKey: "auth.verification_code_sent_to_phone",
      message: "A verification code has been sent to your phone number.",
    },
    VERIFICATION_CODE_WILL_BE_SENT_TO_EMAIL: {
      i18nKey: "auth.verification_will_be_code_sent_to_email",
      message:
        "A verification code will be sent to your email address shortly.",
    },
    VERIFICATION_WILL_BE_CODE_SENT_TO_PHONE: (
      channelType: OtpMessageChannel,
    ) => ({
      i18nKey: "auth.verification_will_be_code_sent_to_phone",
      message:
        "A verification code will be sent to your phone number shortly. Check your {{channelType}} Messages",
      interpolations: { channelType },
    }),
    WELCOME_BACK_ACCOUNT_RESTORED: {
      i18nKey: "auth.welcome_back_account_restored",
      message: "Welcome back! Your account has been fully restored.",
    },
    WHATSAPP_CONFIG_FAILED: {
      i18nKey: "auth.whatsapp_config_failed",
      message: "WhatsApp API configuration is invalid",
    },
    WHATSAPP_CHECK_FAILED: {
      i18nKey: "auth.whatsapp_check_failed",
      message: "WhatsApp status check failed",
    },
  },

  GATEWAY: {
    CONFIG_MISSING: (targetEnvVar: string): TransInfo => ({
      i18nKey: "gateway.config_missing",
      message: "Config missing: {{targetEnvVar}}",
      interpolations: { targetEnvVar },
    }),
    RATE_LIMIT_EXCEEDED: (
      currentUsage: number | string,
      limit: number | string,
    ): TransInfo => ({
      i18nKey: "gateway.rate_limit_exceeded",
      message:
        "Too many requests: Rate limit exceeded. Your current usage is {{currentUsage}}/{{limit}}",
      interpolations: { currentUsage, limit },
    }),
    SERVICE_UNAVAILABLE: {
      i18nKey: "gateway.service_unavailable",
      message: "Service unavailable",
    },
    WELCOME_MESSAGE: {
      i18nKey: "gateway.welcome_message",
      message: "Welcome to Funstakes API Gateway",
    },
  },

  UPLOAD: {
    INVALID_OR_MISSING_FILE_TYPE: {
      i18nKey: "upload.invalid_or_missing_file_type",
      message: "Invalid or missing fileType parameter.",
    },
    LOCALIZATION_PARAMS_REQUIRED: {
      i18nKey: "upload.localization_params_required",
      message: "Missing required tracking upload options.",
    },
    LOCALIZATION_PERSISTED_SUCCESSFULLY: {
      i18nKey: "upload.localization_persisted_successfully",
      message: "Localization block persisted successfully.",
    },
    LOCALIZATION_UPLOAD_THROWN_ERROR: {
      i18nKey: "upload.localization_upload_thrown_error",
      message: "System localization R2 push failed",
    },
    PRE_SIGNED_POST_POLICY_SUCCESS: {
      i18nKey: "upload.pre_signed_post_policy_success",
      message: "Pre-signed POST policy generated successfully",
    },
    PRE_SIGNED_POST_POLICY_THROWN_ERROR: {
      i18nKey: "upload.pre_signed_post_policy_thrown_error",
      message: "S3 Presign Policy Error",
    },
    PUBLIC_DELIVERY_LINK_RESOLVED: {
      i18nKey: "upload.public_delivery_link_resolved",
      message: "Public delivery link resolved successfully",
    },
    PRE_SIGNED_URL_SUCCESS: {
      i18nKey: "upload.pre_signed_url_success",
      message: "Pre-signed URL generated successfully",
    },
    PRE_SIGNED_URL_THROWN_ERROR: {
      i18nKey: "upload.pre_signed_url_thrown_error",
      message: "S3 Presign PUT URL Error",
    },
    MULTIPART_SESSION_INITIALIZED: {
      i18nKey: "upload.multipart_session_initialized",
      message: "Multipart session initialized",
    },
    MULTIPART_SESSION_THROWN_ERROR: {
      i18nKey: "upload.multipart_session_thrown_error",
      message: "Init Multipart Error",
    },
    PART_SEGMENT_LINK_GENERATED: {
      i18nKey: "upload.part_segment_link_generated",
      message: "Part segment link generated",
    },
    PART_SEGMENT_LINK_THROWN_ERROR: {
      i18nKey: "upload.part_segment_link_thrown_error",
      message: "Sign Part Error",
    },
    MULTIPART_ASSET_ASSEMBLED: {
      i18nKey: "upload.multipart_asset_assembled",
      message: "Multipart asset successfully assembled",
    },
    MULTIPART_ASSET_ASSEMBLED_THROWN_ERROR: {
      i18nKey: "upload.multipart_asset_assembled_thrown_error",
      message: "Complete Multipart Error: {{reason}}",
    },
  },

  ONBOARDING: {
    MISSING_STEP: {
      i18nKey: "onboarding.missing_step",
      message: "The parameter onboardingStep is required.",
    },
    SERVER_ERROR: (message: string): TransInfo => ({
      i18nKey: "onboarding.server_error",
      message: "{{message}}",
      interpolations: { message },
    }),
    PROGRESS_SYNCHRONIZED: {
      i18nKey: "onboarding.progress_synchronized",
      message: "Onboarding progress synchronized.",
    },
  },

  POST: {
    ACCESS_DENIED_OWN_DRAFTS_ONLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.access_denied_own_drafts_only",
      message:
        "Access Denied. You can only view your own {{msgPostType}} drafts.",
      interpolations: { msgPostType },
    }),
    BYPASS_CREATION_SUCCESS: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.bypass_creation_success",
      message: "{{msgPostType}} created successfully via skip bypass pathing.",
      interpolations: { msgPostType },
    }),
    COMMENT_NOT_FOUND: {
      i18nKey: "post.comment_not_found",
      message: "Comment entity not found",
    },
    CONTENT_REQUIRED: (msgPostType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.content_required",
      message: "{{msgPostType}} must contain either text content or media.",
      interpolations: { msgPostType },
    }),
    CREATION_FALLBACK_ERROR: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.creation_fallback_error",
      message: "Failed to create {{msgPostType}} due to a server error.",
      interpolations: { msgPostType },
    }),
    DRAFT_FALLBACK_ERROR: (msgPostType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.draft_fallback_error",
      message:
        "Failed to preserve {{msgPostType}} draft tracking state due to a server error.",
      interpolations: { msgPostType },
    }),
    DRAFT_NOT_FOUND_OR_UNAUTHORIZED: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.draft_not_found_or_unauthorized",
      message:
        "Target {{msgPostType}} draft reference not found or unauthorized access attempt flagged.",
      interpolations: { msgPostType },
    }),
    DRAFT_SAVED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.draft_saved_successfully",
      message: "{{msgPostType}} successfully saved as a draft.",
      interpolations: { msgPostType },
    }),
    DRAFT_UPDATED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.draft_updated_successfully",
      message: "{{msgPostType}} draft progress updated successfully.",
      interpolations: { msgPostType },
    }),
    DYNAMIC_CAPTION_TRANSLATED: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.dynamic_caption_translated",
      message: "Dynamic caption translated successfully.",
      interpolations: { msgPostType },
    }),
    FEED_WELCOME_MESSAGE: {
      i18nKey: "post.feed_welcome_message",
      message: "Welcome to Funstakes Feed API",
    },
    FOLLOWERS_FEED_EMPTY: {
      i18nKey: "post.followers_feed_empty",
      message: "Follow more users to see posts here!",
    },
    FOLLOWERS_FEED_FALLBACK_ERROR: {
      i18nKey: "post.followers_feed_fallback_error",
      message: "Failed to retrieve followers feed due to server error.",
    },
    FOLLOWERS_FEED_FETCHED_SUCCESSFULLY: {
      i18nKey: "post.followers_feed_fetched_successfully",
      message: "Followers feed fetched successfully",
    },
    FOLLOW_MORE_USERS_MESSAGE: {
      i18nKey: "post.follow_more_users_message",
      message: "Follow more users to see posts here!",
    },
    GLOBAL_FEED_FALLBACK_ERROR: {
      i18nKey: "post.global_feed_fallback_error",
      message: "Failed to fetch global feed content due to server error.",
    },
    GLOBAL_FEED_FETCHED_SUCCESSFULLY: {
      i18nKey: "post.global_feed_fetched_successfully",
      message: "Global feed fetched successfully",
    },
    INITIATE_POST_FAILED: (msgPostType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.initiate_post_failed",
      message: "Failed to initiate {{msgPostType}}",
      interpolations: { msgPostType },
    }),
    INVALID_POST_ID: {
      i18nKey: "post.invalid_post_id",
      message: "Invalid Post ID",
    },
    INVALID_POST_ID_OR_SESSION: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.invalid_post_id_or_session",
      message: "Invalid {{msgPostType}} ID or Session",
      interpolations: { msgPostType },
    }),
    INVALID_POST_TYPE: {
      i18nKey: "post.invalid_post_type",
      message: "Invalid postType",
    },
    INVALID_SESSION: (msgPostType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.invalid_session",
      message: "Invalid User Session",
      interpolations: { msgPostType },
    }),
    INVALID_USER_ID_FORMAT: {
      i18nKey: "post.invalid_user_id_format",
      message: "Invalid User ID format",
    },
    INVALID_USER_SESSION: {
      i18nKey: "post.invalid_user_session",
      message: "Invalid User Session",
    },
    MAXIMUM_EDIT_LIMIT_REACHED: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.maximum_edit_limit_reached",
      message: "Maximum edit limit (3) reached for this {{msgPostType}}.",
      interpolations: { msgPostType },
    }),
    MISSING_POST_PROCESSING_PARAMS: {
      i18nKey: "post.missing_post_processing_params",
      message:
        "targetId and targetModel are required parameters for post processing operations.",
    },
    PERMISSION_DENIED: {
      i18nKey: "post.permission_denied",
      message: "Permission denied",
    },
    POST_ALREADY_REPORTED: {
      i18nKey: "post.post_already_reported",
      message: "You have already reported this post.",
    },
    POST_SOURCE_NOT_FOUND: {
      i18nKey: "post.post_source_not_found",
      message: "Source post not found.",
    },
    POST_AUTOMATED_REJECTION_NOTE: {
      i18nKey: "post.post_automated_rejection_note",
      message:
        "Automated rejection: Content exceeded maximum moderation cycles.",
    },
    POST_BANNED_AND_PENALIZED: {
      i18nKey: "post.post_banned_and_penalized",
      message: "Post banned and user penalized.",
    },
    POST_AUTOMATED_SUSPENSION_REASON: (strikes: number) => ({
      i18nKey: "post.post_automated_suspension_reason",
      message: "Automated: {{strikes}} strikes reached.",
      interpolations: { strikes },
    }),
    POST_PLACED_UNDER_REVIEW: {
      i18nKey: "post.post_placed_under_review",
      message: "Post placed under review.",
    },
    POST_REPORT_RECEIVED: {
      i18nKey: "post.post_report_received",
      message: "Report received.",
    },
    POST_FLAGGING_SYNC_THROWN_ERROR: (reason: string) => ({
      i18nKey: "post.post_flagging_sync_thrown_error",
      message: "Flaging Sync Error: {{reason}}",
      interpolations: { reason },
    }),
    POST_FLAGGING_SYNC_FALLBACK_ERROR: {
      i18nKey: "post.post_flagging_sync_fallback_error",
      message: "Internal flagging synchronization error.",
    },
    POST_BEING_PROCESSED: (msgPostType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.post_being_processed",
      message: "{{msgPostType}} is being processed.",
      interpolations: { msgPostType },
    }),
    POSTS_FETCHED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.posts_fetched_successfully",
      message: "{{msgPostType}}s fetched successfully",
      interpolations: { msgPostType },
    }),
    POST_CREATED_SUCCESSFULLY_VIA_SKIP_BYPASS: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_created_successfully_via_skip_bypass",
      message: "{{msgPostType}} created successfully via skip bypass pathing.",
      interpolations: { msgPostType },
    }),
    POST_DATA_INITIATED_TAXONOMY_EXTRACTION: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_data_initiated_taxonomy_extraction",
      message:
        "{{msgPostType}} data initiated. Extracting contextual taxonomy descriptors.",
      interpolations: { msgPostType },
    }),
    POST_FETCHED_AND_HYDRATED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_fetched_and_hydrated_successfully",
      message: "{{msgPostType}} fetched and hydrated successfully",
      interpolations: { msgPostType },
    }),
    POST_DETAIL_FETCHED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_detail_fetched_successfully",
      message: "{{msgPostType}} detail fetched successfully",
      interpolations: { msgPostType },
    }),
    POST_LIKED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_liked_successfully",
      message: "{{msgPostType}} liked successfully",
      interpolations: { msgPostType },
    }),
    POST_LIKE_FALLBACK_ERROR: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_like_fallback_error",
      message: "Server error while toggling {{msgPostType}} like",
      interpolations: { msgPostType },
    }),
    POST_MUST_CONTAIN_TEXT_OR_MEDIA: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_must_contain_text_or_media",
      message: "{{msgPostType}} must contain either text content or media.",
      interpolations: { msgPostType },
    }),
    POST_NOT_FOUND: (postType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.post_not_found",
      message: "{{msgPostType}} not found",
      interpolations: { msgPostType: postType },
    }),
    POST_UNLIKED_SUCCESSFULLY: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_unliked_successfully",
      message: "{{msgPostType}} unliked successfully",
      interpolations: { msgPostType },
    }),
    POST_UPDATE_UNDERGOING_MODERATION_REVIEW: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_update_undergoing_moderation_review",
      message: "{{msgPostType}} update is undergoing moderation review.",
      interpolations: { msgPostType },
    }),
    POST_TOPICS_FETCHED_SUCCESS: {
      i18nKey: "post.post_topics_fetched_success",
      message: "Fetched topics successfully.",
    },
    POST_TOPIC_LOOKUP_FAILED: {
      i18nKey: "post.post_topic_lookup_failed",
      message: "Error processing post topic lookup directory.",
    },
    POST_TOPIC_IDS_REQUIRED: {
      i18nKey: "post.post_topic_ids_required",
      message: "A list of post topic IDs is required.",
    },
    POST_TOPICS_PRUNED: (count: number) => ({
      i18nKey: "post.post_topics_pruned",
      message: "Removed {{count}} topics.",
      interpolations: { count },
    }),
    POST_TOPICS_PRUNED_FALLBACK_ERROR: {
      i18nKey: "post.post_topics_pruned_fallback_error",
      message: "Error processing unused post topic cleanup directory.",
    },
    POST_TOPICS_LIST_REQUIRED: {
      i18nKey: "post.post_topics_list_required",
      message: "A list of topics is required.",
    },
    POST_TOPICS_PROCESSED_SUCCESSFULLY: {
      i18nKey: "post.topics_processed_successfully",
      message: "Topics processed successfully.",
    },
    POST_TOPICS_UPDATE_FALLBACK_ERROR: {
      i18nKey: "post.post_post_topics_update_fallback_error",
      message: "Error processing taxonomy routing execution graph.",
    },
    PROCESSING_INITIATED: (msgPostType: PostModelType = "Post"): TransInfo => ({
      i18nKey: "post.processing_initiated",
      message: "{{msgPostType}} is being processed.",
      interpolations: { msgPostType },
    }),
    STATE_UPDATE_TRANSACTION_FAILED: {
      i18nKey: "post.state_update_transaction_failed",
      message: "State update transaction failed",
    },
    POST_TOPICS_EXTRACTING: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.post_topics_extracting",
      message: "{{msgPostType}} data initiated. Extracting contextual topics.",
      interpolations: { msgPostType },
    }),
    POST_USER_TOPICS_REMOVED_SUCCESSFULLY: {
      i18nKey: "post.post_user_topics_removed_successfully",
      message: "Topics removed from preferences successfully.",
    },
    POST_USER_TOPICS_REMOVAL_FALLBACK_ERROR: {
      i18nKey: "post.post_user_topics_removal_fallback_error",
      message: "Error updating target user taxonomy preference indices.",
    },
    TIMESTAMP_UPDATED: {
      i18nKey: "post.timestamp_updated",
      message: "Timestamp updated",
    },

    MISSING_TOPIC_IDENTIFIER: {
      i18nKey: "post.missing_identifier",
      message: "Please provide a valid topic ID or title to proceed.",
    },
    TOPIC_REMOVED_SUCCESS: {
      i18nKey: "post.remove_success",
      message: "The topic has been successfully removed.",
    },
    TOPIC_REMOVAL_FAILED: {
      i18nKey: "post.remove_failed",
      message:
        "Unable to remove the selected topic right now. Please try again later.",
    },
    TOPIC_REMOVAL_FALLBACK_ERROR: {
      i18nKey: "post.remove_fallback_error",
      message:
        "An unexpected error occurred while processing your topic removal request.",
    },

    TRANSLATION_API_ERROR: (errorMessage: string): TransInfo => ({
      i18nKey: "post.translation_api_error",
      message: "Cloudflare API execution block exception: {{errorMessage}}",
      interpolations: { errorMessage },
    }),
    TRANSLATION_CACHE_MISS: (
      postId: string,
      targetLang: string,
    ): TransInfo => ({
      i18nKey: "post.translation_cache_miss",
      message:
        "Cache miss for caption [{{postId}}] -> [{{targetLang}}]. Fetching Cloudflare Workers AI...",
      interpolations: { postId, targetLang },
    }),
    TRANSLATION_HTTP_ERROR: (status: number | string): TransInfo => ({
      i18nKey: "post.translation_http_error",
      message:
        "Cloudflare edge API gateway returned status i18nKey: {{status}}",
      interpolations: { status },
    }),
    TRANSLATION_INVALID_CAPTION_ID: {
      i18nKey: "post.translation_invalid_caption_id",
      message: "Invalid caption identifier key format.",
    },
    TRANSLATION_MISSING_ENV: {
      i18nKey: "post.translation_missing_env",
      message:
        "Missing Cloudflare network authentication token environment keys.",
    },
    TRANSLATION_MISSING_OUTPUT: {
      i18nKey: "post.translation_missing_output",
      message:
        "Cloudflare payload did not return a valid translation mapping block.",
    },
    TRANSLATION_MISSING_PARAMS: {
      i18nKey: "post.translation_missing_params",
      message:
        "Missing translation target parameters payload context definitions.",
    },
    TRANSLATION_NOT_REQUIRED: {
      i18nKey: "post.translation_not_required",
      message: "Source and target languages match. No translation required.",
    },
    TRANSLATION_PIPELINE_FAILURE: {
      i18nKey: "post.translation_pipeline_failure",
      message: "Failed to execute translation operations.",
    },
    UNAUTHORIZED_ACCESS: {
      i18nKey: "post.unauthorized_access",
      message: "Unauthorized access",
    },
    UNIQUE_VIEW_RECORDED: {
      i18nKey: "post.unique_view_recorded",
      message: "Unique view recorded",
    },
    UNSUPPORTED_TYPE_BOUNDARY_VARIANT_MATCH: (
      strategyKey: string,
    ): TransInfo => ({
      i18nKey: "post.unsupported_type_boundary_variant_match",
      message: "Unsupported type boundary variant match: {{strategyKey}}",
      interpolations: { strategyKey },
    }),
    UPDATE_MODERATION_STREAM_FAILED: (
      msgPostType: PostModelType = "Post",
    ): TransInfo => ({
      i18nKey: "post.update_moderation_stream_failed",
      message: "Failed to initiate update moderation stream",
      interpolations: { msgPostType },
    }),
    USER_DRAFTS_FALLBACK_ERROR: {
      i18nKey: "post.user_drafts_fallback_error",
      message: "Failed to locate user drafts due to a server error.",
    },
    USER_DRAFTS_RETRIEVED_SUCCESSFULLY: {
      i18nKey: "post.user_drafts_retrieved_successfully",
      message: "User drafts retrieved successfully",
    },
    USER_POSTS_FALLBACK_ERROR: {
      i18nKey: "post.user_posts_fallback_error",
      message: "Failed to load user profile posts due to a server error.",
    },
    USER_POSTS_RETRIEVED_SUCCESSFULLY: {
      i18nKey: "post.user_posts_retrieved_successfully",
      message: "User posts retrieved successfully",
    },
    VIEW_ALREADY_RECORDED: {
      i18nKey: "post.view_already_recorded",
      message: "View already recorded",
    },
    WELCOME_MESSAGE: {
      i18nKey: "post.welcome_message",
      message: "Welcome to Funstakes Post Service API",
    },
  },

  PROFILE: {
    ACCOUNT_DEACTIVATED: {
      i18nKey: "profile.account_deactivated",
      message: "This account has been deactivated.",
    },
    CANNOT_FOLLOW_SELF: {
      i18nKey: "profile.cannot_follow_self",
      message: "You cannot follow yourself.",
    },
    DEMOGRAPHIC_INFORMATION_UPDATED_SUCCESSFULLY: {
      i18nKey: "profile.demographic_information_updated_successfully",
      message: "Demographic information updated successfully.",
    },
    FETCH_USER_ERROR: {
      i18nKey: "profile.fetch_error",
      message: "Failed to get user due to server error.",
    },
    FETCH_USER_LOGS_ERROR: {
      i18nKey: "profile.fetch_user_logs_error",
      message: "Failed to retrieve user activity logs.",
    },
    FOLLOW_ACTION_ERROR: {
      i18nKey: "profile.follow_action_error",
      message: "An error occurred during the follow action.",
    },
    FOLLOW_TOGGLE_SUCCESS: (action: "followed" | "unfollowed"): TransInfo => ({
      i18nKey: "profile.follow_toggle_success",
      message: "User {{action}} successfully.",
      interpolations: { action },
    }),
    FOLLOWERS_FETCH_ERROR: {
      i18nKey: "profile.followers_fetch_error",
      message: "Failed to fetch followers",
    },
    FOLLOWERS_FETCH_SUCCESS: {
      i18nKey: "profile.followers_fetch_success",
      message: "Followers fetched successfully",
    },
    IMAGE_REMOVAL_ERROR: {
      i18nKey: "profile.image_removal_error",
      message: "Failed to remove image reference.",
    },
    IMAGE_REMOVAL_SUCCESS: (imageType: string): TransInfo => {
      return {
        i18nKey: "profile.image_removal_success",
        message: "{{imageType}} image removed from view.",
        interpolations: { imageType },
      };
    },
    IMAGE_UPDATE_ERROR: {
      i18nKey: "profile.image_update_error",
      message: "Failed to update profile images.",
    },
    IMAGE_UPDATE_SUCCESS: (imageType: string): TransInfo => {
      return {
        i18nKey: "profile.image_update_success",
        message: "{{imageType}} image updated successfully.",
        interpolations: { imageType },
      };
    },
    INVALID_ID_FORMAT: {
      i18nKey: "profile.invalid_id_format",
      message: "Invalid user ID format.",
    },
    INVALID_IMAGE_PAYLOAD: {
      i18nKey: "profile.invalid_image_payload",
      message:
        "url, fileKey, and a valid imageType (PROFILE/COVER) are required.",
    },
    INVALID_IMAGE_TYPE: {
      i18nKey: "profile.invalid_image_type",
      message: "Invalid image type. Must be 'PROFILE' or 'COVER'.",
    },
    INVALID_USERNAME: {
      i18nKey: "profile.invalid_username",
      message: "Invalid username.",
    },
    NO_FOLLOWER_FOUND: {
      i18nKey: "profile.no_follower_found",
      message: "No follower found",
    },
    NO_USER_LOGS_FOUND: {
      i18nKey: "profile.no_user_logs_found",
      message: "No activity logs found for this user.",
    },
    UNAUTHENTICATED_PREFERENCE_UPDATE: {
      i18nKey: "profile.unauthenticated_preference_update",
      message: "User not authenticated for preference updates.",
    },
    UPDATE_DEMO_ERROR: {
      i18nKey: "profile.update_demo_error",
      message: "Failed to update demographic info.",
    },
    UPDATE_INFO_ERROR: {
      i18nKey: "profile.update_info_error",
      message: "Failed to update user info.",
    },
    USER_BASIC_DETAILS_UPDATED_SUCCESSFULLY: {
      i18nKey: "profile.user_basic_details_updated_successfully",
      message: "User basic details updated successfully.",
    },
    USER_FETCHED_SUCCESSFULLY: {
      i18nKey: "profile.user_fetched_successfully",
      message: "User fetched successfully.",
    },
    USER_LOGS_FETCHED_SUCCESS: {
      i18nKey: "profile.user_logs_fetched_success",
      message: "User activity logs retrieved successfully.",
    },
    USERNAME_COOLDOWN_ACTIVE: (daysLeft: number | string): TransInfo => ({
      i18nKey: "profile.username_cooldown_active",
      message: "Cooldown active. Wait {{daysLeft}} days.",
      interpolations: { daysLeft },
    }),
    USERNAME_TAKEN: {
      i18nKey: "profile.username_taken",
      message: "Username already taken.",
    },
    USERNAME_UPDATED_SUCCESSFULLY: {
      i18nKey: "profile.username_updated_successfully",
      message: "Username updated successfully.",
    },
  },

  SETTINGS: {
    EMPTY_UPDATE_PAYLOAD: {
      i18nKey: "settings.empty_update_payload",
      message: "Settings update payload cannot be empty.",
    },
    FETCHED_SUCCESSFULLY: {
      i18nKey: "settings.fetched_successfully",
      message: "User settings fetched successfully.",
    },
    INVALID_MUTED_WORDS_PAYLOAD: {
      i18nKey: "settings.invalid_muted_words_payload",
      message: "A non-empty array of valid word strings is required.",
    },
    MUTED_WORDS_UPDATED: {
      i18nKey: "settings.muted_words_updated",
      message: "Muted words filter updated successfully.",
    },
    NO_UPDATE_FIELDS_PROVIDED: {
      i18nKey: "settings.no_update_fields_provided",
      message: "No valid settings fields were provided for update.",
    },
    SERVER_FALLBACK_ERROR: {
      i18nKey: "settings.server_fallback_error",
      message:
        "An unexpected error occurred while processing settings request.",
    },
    SETTINGS_NOT_FOUND: {
      i18nKey: "settings.settings_not_found",
      message: "Requested user settings profile was not found.",
    },
    UPDATED_SUCCESSFULLY: {
      i18nKey: "settings.updated_successfully",
      message: "User settings updated successfully.",
    },
  },

  SYSTEM: {
    ERROR_LOGS_FETCHED_SUCCESS: {
      i18nKey: "system.error_logs_fetched_success",
      message: "System error logs retrieved successfully.",
    },
    ERROR_LOG_DETAILS_FETCHED: {
      i18nKey: "system.error_log_details_fetched",
      message: "Error log details retrieved successfully.",
    },
    ERROR_LOG_NOT_FOUND: {
      i18nKey: "system.error_log_not_found",
      message: "Requested error log trace entry does not exist.",
    },
    ERROR_LOGS_PURGED_SUCCESS: {
      i18nKey: "system.error_logs_purged_success",
      message: "Targeted error logs purged from system tracking records.",
    },
    FETCH_ERROR_LOGS_FAILED: {
      i18nKey: "system.fetch_error_logs_failed",
      message: "Failed to pull system diagnostic records.",
    },
    INTERNAL_SERVER_ERROR: {
      i18nKey: "system.internal_server_error",
      message: "Internal Server Error",
    },
    INVALID_OPERATIONAL_ROUTING: {
      i18nKey: "system.invalid_operational_routing",
      message: "Invalid operational routing type target received.",
    },
    NO_ERROR_LOGS_FOUND: {
      i18nKey: "system.error_logs_found_none",
      message: "No matching system error logs found.",
    },
    PURGE_ERROR_LOGS_FAILED: {
      i18nKey: "system.purge_error_logs_failed",
      message: "Failed to execute error record maintenance purge.",
    },
    POLICY_REQUIREMENT_FAILED: {
      i18nKey: "system.policy_requirement_failed",
      message: "Forbidden: Policy requirements not met.",
    },
    INSUFFICIENT_ROLE_PERMISSIONS: {
      i18nKey: "system.insuffient_role_permissions",
      message: "Forbidden: Insufficient role permissions",
    },
    ROLE_NOT_FOUND: (roleName: RoleName) => ({
      i18nKey: "system.role_not_found",
      message: "Role {{roleName}} not found in database.",
      interpolations: { roleName },
    }),
    SUBSCRIPTION_CANCELLED: {
      i18nKey: "system.subscription_cancelled",
      message: "Subscription successfully cancelled.",
    },
    SUBSCRIPTION_FETCHED: {
      i18nKey: "system.subscription_fetched",
      message: "Account successfully fetched.",
    },
    SUBSCRIPTION_UPDATED: {
      i18nKey: "system.subscription_cancelled",
      message: "Subscription successfully updated.",
    },
    SUBSCRIPTION_INVALID_TYPE: {
      i18nKey: "system.subscription_invalid_type",
      message: "Invalid subscription type.",
    },
    SUBSCRIPTION_NOT_FOUND: {
      i18nKey: "system.subscription_not_found",
      message: "Subscription not found.",
    },
    PREMIUM_SUBSCRIPTION_INELIGIBLE: {
      i18nKey: "system.ineligible_premium_subscription",
      message: "You are currently not eligible for a Premium subscription.",
    },
    ENTERPRISE_SUBSCRIPTION_INELIGIBLE: {
      i18nKey: "system.ineligible_enterprise_subscription",
      message: "You are currently not eligible for an Enterprise subscription.",
    },
    TARGET_MODEL_NOT_FOUND: (modelName: string) => ({
      i18nKey: "system.target_model_not_found",
      message: "{{modelName}} not found.",
      interpolations: { modelName },
    }),
  },

  VERIFICATION: {
    ALREADY_PENDING: {
      i18nKey: "verification.already_pending",
      message: "You already have a pending verification request.",
    },
    INELIGIBLE: {
      i18nKey: "verification.ineligible",
      message: "You are not yet eligible to apply for verification.",
    },
    NAME_ID_DOC_SELFIE_REQUIRED: {
      i18nKey: "verification.missing_fields",
      message: "Full name, ID document, and verification selfie are required.",
    },
    REQUEST_SUBMITTED_SUCCESSFULLY: {
      i18nKey: "verification.request_submitted_successfully",
      message:
        "Verification request submitted. Our team will review your documents.",
    },
    SERVER_ERROR: {
      i18nKey: "verification.server_error",
      message: "Internal server error.",
    },
  },

  WORKER: {
    INTERNAL_ENGINE_TRANSACTION_FAILURE: (errorMessage: string): TransInfo => ({
      i18nKey: "worker.internal_engine_transaction_failure",
      message: "Internal engine transaction failure: {{errorMessage}}",
      interpolations: { errorMessage },
    }),
    STATE_UPDATE_TRANSACTION_FAILED: {
      i18nKey: "worker.state_update_transaction_failed",
      message: "State update transaction failed",
    },
    UNSUPPORTED_TYPE_BOUNDARY_VARIANT_MATCH: (
      strategyKey: string,
    ): TransInfo => ({
      i18nKey: "worker.unsupported_type_boundary_variant_match",
      message: "Unsupported type boundary variant match: {{strategyKey}}",
      interpolations: { strategyKey },
    }),
    WELCOME_MESSAGE: {
      i18nKey: "worker.welcome_message",
      message: "Welcome to Funstakes Worker Service API",
    },
  },
} as const satisfies RegistryStructure;

export type UnifiedMessageRegistry = typeof MESSAGES_REGISTRY;
