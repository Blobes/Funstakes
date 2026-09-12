import {
  AllowedVerificationTypes,
  OtpMessageChannel,
  VerifyIdentityMethod,
} from "../types/auth";
import { ITranslation } from "../types/ui-props";
import {
  ALLOWED_VERIFICATION_METHODS,
  MESSAGING_CHANNELS,
  VERIFY_IDENTITY_METHODS,
} from "./others";

export type TranslationNode =
  | ITranslation
  | ((...args: any[]) => ITranslation)
  | { readonly [tKey: string]: TranslationNode };

export type TranslationRegistry = {
  readonly [namespace: string]: {
    readonly [section: string]: TranslationNode;
  };
};

/**
 * Authentication handling structures. Extracts to ../../../locale/versions/en/auth.json
 */
export const auth = {
  button: {
    back_to_login: {
      tKey: "auth:button.back_to_login",
      tValue: "Back to Login",
    },
    change_credential: {
      tKey: "auth:button.change_credential",
      tValue: "Change credential",
    },
    create_account: {
      tKey: "auth:button.create_account",
      tValue: "Create account",
    },
    login: { tKey: "auth:button.login", tValue: "Login" },
    login_now: {
      tKey: "auth:button.login_now",
      tValue: "Login Now",
    },
    logout: { tKey: "auth:button.logout", tValue: "Logout" },
    not_yet: {
      tKey: "auth:button.not_yet",
      tValue: "Not yet",
    },
    otp_resend_code_in_seconds: (seconds: number) => ({
      tKey: "auth:button.otp_resend_code_in_seconds",
      tValue: "Resend in {{seconds}}s",
      interpolations: { seconds },
    }),
    otp_resend_code_now: {
      tKey: "auth:button.otp_resend_code_now",
      tValue: "Resend",
    },
    otp_switch_channel: (channel: string) => ({
      tKey: "auth:button.otp_switch_channel",
      tValue: "Send via {{channel}}",
      interpolations: { channel },
    }),
    otp_verify_code: {
      tKey: "auth:button.otp_verify_code",
      tValue: "Verify code",
    },
    proceed: { tKey: "auth:button.proceed", tValue: "Proceed" },
    proceed_to_verification: {
      tKey: "auth:button.proceed_to_verification",
      tValue: "Proceed to verification",
    },
    reconfigure: {
      tKey: "auth:button.reconfigure",
      tValue: "Reconfigure",
    },
    reset_password: {
      tKey: "auth:button.reset_password",
      tValue: "Reset password",
    },
    restore_account: {
      tKey: "auth:button.restore_account",
      tValue: "Restore Account",
    },
    resume: {
      tKey: "auth:button.resume",
      tValue: "Resume",
    },
    retry_translation: {
      tKey: "auth:button.retry_translation",
      tValue: "Retry translation",
    },
    see_original: {
      tKey: "auth:button.see_original",
      tValue: "See original",
    },
    see_translation: {
      tKey: "auth:button.see_translation",
      tValue: "See Translation",
    },
    set_password: {
      tKey: "auth:button.set_password",
      tValue: "Set password",
    },
    signup: { tKey: "auth:button.signup", tValue: "Sign up" },
    sure_i_do: {
      tKey: "auth:button.sure_i_do",
      tValue: "Sure I do",
    },
    terminate_session: {
      tKey: "auth:button.terminate_session",
      tValue: "Terminate session",
    },
    verify_with_authenticator: {
      tKey: "auth:button.use_authenticator",
      tValue: "Authenticator Code",
    },
    verify_with_security_questions: {
      tKey: "auth:button.use_security_questions",
      tValue: "Security Questions",
    },
    try_other_methods: {
      tKey: "auth:button.try_other_methods",
      tValue: "Try other methods",
    },
    verify_and_proceed: {
      tKey: "auth:button.verify_and_proceed",
      tValue: "Verify & proceed",
    },
    verify_with_email_phone: {
      tKey: "auth:button.verify_with_email_phone",
      tValue: "Verify with Email / Phone",
    },
  },

  feedback: {
    account_deactivated_headline: {
      tKey: "auth:feedback.account_deactivated_headline",
      tValue: "Account is Deactivated",
    },
    account_deactivated_tagline: {
      tKey: "auth:feedback.account_deactivated_tagline",
      tValue: "To restore it, click the 'Restore account' button",
    },
    account_suspended_headline: {
      tKey: "auth:feedback.account_suspended_headline",
      tValue: "Account Suspended",
    },
    account_suspended_tagline: {
      tKey: "auth:feedback.account_suspended_tagline",
      tValue: "Your account has been suspended for violating our terms.",
    },
    authenticator_not_configured: {
      tKey: "auth.authenticator_not_configured",
      tValue: "Authenticator app is not configured for this account",
    },
    already_have_an_account: {
      tKey: "auth:feedback.already_have_an_account",
      tValue: "Already have an account?",
    },
    already_signed_in_headline: {
      tKey: "auth:feedback.already_signed_in_headline",
      tValue: "You are already signed in",
    },
    already_signed_in_tagline: {
      tKey: "auth:feedback.already_signed_in_tagline",
      tValue: "Return to funstakes.com or logout",
    },
    confirm_identity: {
      tKey: "auth:feedback.confirm_identity",
      tValue: "Confirm your identity",
    },
    enter_password_to_login: (
      attemptCount: number = 3,
      lockTime: number = 2,
    ) => ({
      tKey: "auth:feedback.enter_password_to_login",
      tValue:
        "Enter your password to login. After <strong>{{attemptCount}}</strong> incorrect entries, your access will be locked for <strong>{{lockTime}}</strong> minutes.",
      interpolations: { lockTime, attemptCount },
    }),
    enter_code_manually: {
      tKey: "auth:feedback.enter_code_manually",
      tValue: "Or enter code manually",
    },
    failed_to_load_auth_data: {
      tKey: "auth:feedback.failed_to_load_auth_data",
      tValue: "Failed to load authenticator data",
    },
    few_minutes_to_setup_account: {
      tKey: "auth:feedback.few_minutes_to_setup_account",
      tValue: "It only takes a few minutes to set up your account.",
    },
    finish_setting_up_headline: {
      tKey: "auth:feedback.finish_setting_up_headline",
      tValue: "Finish Setting Up",
    },
    finish_setting_up_tagline: {
      tKey: "auth:feedback.finish_setting_up_tagline",
      tValue:
        "You're almost there! Complete your profile setup to unlock full access to all features.",
    },
    incorrect_password_attempts_many: (count: number) => ({
      tKey: "auth:feedback.incorrect_password_attempts_many",
      tValue:
        "<strong>Incorrect password. </strong>You have <counter>{{count}}</counter> attempts left before your login is temporarily locked.",
      interpolations: { count },
    }),
    incorrect_password_attempts_one: (count: number) => ({
      tKey: "auth:feedback.incorrect_password_attempts_one",
      tValue:
        "<strong>Incorrect password. </strong>You have <counter>{{count}}</counter> attempt left before your login is temporarily locked.",
      interpolations: { count },
    }),
    lets_confirm_its_you: {
      tKey: "auth:feedback.lets_confirm_its_you",
      tValue:
        "Enter your email or phone number below to authorize a password reset.",
    },
    loading_auth_data: {
      tKey: "auth:feedback.loading_auth_data",
      tValue: "Loading authenticator data",
    },
    login_activated_tagline: {
      tKey: "auth:feedback.login_activated_tagline",
      tValue: "Login Activated",
    },
    login_failed: {
      tKey: "auth:feedback.login_failed",
      tValue: "Login failed. Please verify your entries.",
    },
    logout_confirmation: {
      tKey: "auth:feedback.logout_confirmation",
      tValue: "Do you really want to logout?",
    },
    mfa_activated: {
      tKey: "auth:feedback.mfa_activated",
      tValue: "Multifactor Authentication Activated.",
    },
    new_code_sent_tagline: (channel: string) => ({
      tKey: "auth:feedback.new_code_sent_tagline",
      tValue: "A new code has been sent to your {{channel}}.",
      interpolations: { channel },
    }),
    need_to_scan_qr_code_again: {
      tKey: "auth:feedback.need_to_scan_qr_code_again",
      tValue: " Need to scan QR code again?",
    },
    no_account_found_email: {
      tKey: "auth:feedback.no_account_found_email",
      tValue: "We couldn't find an account with the email address.",
    },
    no_account_found_phone: {
      tKey: "auth:feedback.no_account_found_phone",
      tValue: "We couldn't find an account with the phone number.",
    },
    no_account_found_username: {
      tKey: "auth:feedback.no_account_found_username",
      tValue: "We couldn't find an account with the username.",
    },
    no_email_or_phone: (nextChannel: string) => ({
      tKey: "auth:feedback.no_email_or_phone",
      tValue: "No {{nextChannel}} found on your profile.",
      interpolations: { nextChannel },
    }),
    no_password_reset_sesion_found: {
      tKey: "auth:feedback.no_password_reset_sesion_found",
      tValue: "No password reset session found",
    },
    no_required_onboarding_headline: {
      tKey: "auth:feedback.no_required_onboarding_headline",
      tValue: "No Required Onboarding",
    },
    no_required_onboarding_tagline: {
      tKey: "auth:feedback.no_required_onboarding_tagline",
      tValue: "You have already completed the onboarding step.",
    },
    no_verification_sesion_found: {
      tKey: "auth:feedback.no_verification_sesion_found",
      tValue: "No OTP verification session found",
    },
    or_sign_in_with: {
      tKey: "auth:feedback.or_sign_in_with",
      tValue: "Or sign in with",
    },
    or_sign_up_with: {
      tKey: "auth:feedback.or_sign_up_with",
      tValue: "Or sign up with",
    },
    otp_code_sent: (recipient: string) => ({
      tKey: "auth:feedback.otp_code_sent",
      tValue: "We sent a 6-digit code to <strong>{{recipient}}</strong>",
      interpolations: { recipient },
    }),
    otp_didnt_receive_code: {
      tKey: "auth:feedback.otp_didnt_receive_code",
      tValue: "Didn't receive a code?",
    },
    otp_invalid_code: {
      tKey: "auth:feedback.otp_invalid_code",
      tValue: "Invalid code.",
    },
    mfa_setup_with_msg_channel: (channel: OtpMessageChannel) => ({
      tKey: "auth:feedback.mfa_setup_with_msg_channel",
      tValue: "Set up MFA with {{channel}} Code",
      interpolations: { channel: MESSAGING_CHANNELS[channel] },
    }),
    mfa_setup_without_msg_channel: (method: VerifyIdentityMethod) => ({
      tKey: "auth:feedback.mfa_setup_without_msg_channel",
      tValue: "Set up MFA with {{method}}",
      interpolations: { method: VERIFY_IDENTITY_METHODS[method] },
    }),
    missing_mfa_setup_session: {
      tKey: "auth:feedback.missing_mfa_setup_session",
      tValue: "Missing MFA setup session data.",
    },
    missing_verification_session: (method: AllowedVerificationTypes) => ({
      tKey: "auth:feedback.missing_verification_session",
      tValue: "Missing {{method}} verification session data.",
      interpolations: { method: ALLOWED_VERIFICATION_METHODS[method] },
    }),
    otp_send_code_failed: {
      tKey: "auth:feedback.otp_send_code_failed",
      tValue: "Failed to send code.",
    },
    otp_phone_region_not_supported: {
      tKey: "feedback.otp_phone_region_not_supported",
      tValue:
        "Phone number country code is not currently supported for SMS OTP delivery.",
    },
    password_locked_headline: {
      tKey: "auth:feedback.password_locked_headline",
      tValue: "Password Access Locked",
    },
    password_locked_tagline: (timerValue: string) => ({
      tKey: "auth:feedback.password_locked_tagline",
      tValue:
        "You've exceeded the maximum password attempts. Try again in <timer>{{timerValue}}</timer>. Proceed to password reset if you can't remember.",
      interpolations: { timerValue },
    }),
    password_reset_finalization_failed: {
      tKey: "auth:feedback.password_reset_finalization_failed",
      tValue: "Failed to finalize password reset.",
    },
    password_reset_initiation_failed: {
      tKey: "auth:feedback.password_reset_initiation_failed",
      tValue: "Failed to initiate password reset.",
    },
    password_reset_not_allowed_headline: {
      tKey: "auth:feedback.password_reset_not_allowed_headline",
      tValue: "Password reset not allowed",
    },
    password_reset_not_allowed_tagline: {
      tKey: "auth:feedback.password_reset_not_allowed_tagline",
      tValue:
        "Password reset is not allowed for users who are not logged out. Please log out to initiate a reset.",
    },
    password_reset_successful_headline: {
      tKey: "auth:feedback.password_reset_successful_headline",
      tValue: "Pasword reset successful",
    },
    password_reset_successful_tagline: {
      tKey: "auth:feedback.password_reset_successful_tagline",
      tValue:
        "You have successfully reset your password. Login to start staking.",
    },
    passwords_do_not_match: {
      tKey: "auth:feedback.passwords_do_not_match",
      tValue: "Passwords do not match",
    },
    passwords_is_required: {
      tKey: "auth:feedback.passwords_is_required",
      tValue: "Password is required.",
    },
    registration_failed: {
      tKey: "auth:feedback.registration_failed",
      tValue: "Registration failed. Please verify your entries.",
    },
    reset_your_password: {
      tKey: "auth:feedback.reset_your_password",
      tValue: "Reset your password",
    },
    resume_account_setup: {
      tKey: "auth:feedback.resume_account_setup",
      tValue:
        "It looks like you didn't finish setting up your account. Pick up right where you left off to get started with Funstakes.",
    },
    return_home: {
      tKey: "auth:feedback.return_home",
      tValue: "Please return to Home or the previous page",
    },
    security_details_updated_tagline: {
      tKey: "auth:feedback.security_details_updated_tagline",
      tValue: "Security details updated successfully.",
    },
    security_questions_verification_failed: {
      tKey: "auth:feedback.security_questions_verification_failed",
      tValue: "Verification with Security Question failed",
    },

    server_error: {
      tKey: "auth:feedback.server_error",
      tValue: "An unexpected error occurred during verification",
    },
    session_expired: {
      tKey: "auth:feedback.security_details_updated_tagline",
      tValue: "Your session has expired. Please log in again.",
    },
    set_new_password_headline: {
      tKey: "auth:feedback.set_new_password_headline",
      tValue: "Set a new password",
    },
    set_new_password_tagline: {
      tKey: "auth:feedback.set_new_password_tagline",
      tValue: "Now you can create a new unique password for your account",
    },
    setup_legal_names_username: {
      tKey: "auth:feedback.session_expired",
      tValue: "Set up your legal names and unique username.",
    },
    totp_mfa_setup_tagline: {
      tKey: "auth:feedback.setup_authenticator_tagline",
      tValue:
        "Scan the QR code below with your authenticator app (like Google Authenticator or 1Password) to generate your verification code.",
    },
    security_questions_mfa_setup_tagline: {
      tKey: "auth:feedback.security_questions_mfa_setup_tagline",
      tValue:
        "Select and answer three security questions to protect your account and verify your identity when signing in.",
    },
    select_security_question_first: {
      tKey: "auth:feedback.select_security_question_first",
      tValue: "Select security question first.",
    },
    session_termination_headline: {
      tKey: "auth:feedback.session_termination_headline",
      tValue: "Sure about terminating this session?",
    },
    session_termination_tagline: {
      tKey: "auth:feedback.session_termination_tagline",
      tValue:
        "Terminating this session means your current session will be cleared and your access to this page will be revoked.",
    },
    terminate_session_back_to_login: {
      tKey: "auth:feedback.terminate_session_back_to_login",
      tValue: "Terminate session and return to login",
    },
    unsupported_verification_method: {
      tKey: "auth:feedback.unsupported_verification_method",
      tValue: "Unsupported verification method.",
    },
    user_account_deactivated_tagline: {
      tKey: "auth:feedback.user_account_deactivated_tagline",
      tValue:
        "Your account is currently inactive. Please proceed to the restoration page to recover your access.",
    },
    verification_successful_tagline: {
      tKey: "auth:feedback.verification_successful_tagline",
      tValue: "Verification successful!",
    },
    verify_with_auth_app_tagline: {
      tKey: "auth:feedback.verify_with_auth_app_tagline",
      tValue:
        "Enter the 6-digit code displayed in your authenticator application. Please note that you can only use this method if you've set up Multi-factor Authentication (MFA) for your {{Funstakes}} account",
    },
    verify_with_security_questions_tagline: {
      tKey: "auth:feedback.verify_with_auth_app_tagline",
      tValue: "Verify your identity with your chosen security questions",
    },
    verify_with_msg_channel: (channel: OtpMessageChannel) => ({
      tKey: "auth:feedback.verify_with_msg_channel",
      tValue: "Verify {{channel}} Code",
      interpolations: { channel: MESSAGING_CHANNELS[channel] },
    }),
    verify_without_msg_channel: (method: VerifyIdentityMethod) => ({
      tKey: "auth:feedback.verify_without_msg_channel",
      tValue: "Verify with {{method}}",
      interpolations: { method: VERIFY_IDENTITY_METHODS[method] },
    }),
    verify_your_account_headline: {
      tKey: "auth:feedback.verify_your_account_headline",
      tValue: "Verify your account",
    },
    verify_your_account_tagline: {
      tKey: "auth:feedback.verify_your_account_tagline",
      tValue:
        "You're almost there! Complete your verification process to unlock full access to Funstakes.",
    },
    whatsapp_status_check_failed: {
      tKey: "auth:feedback.whatsapp_status_check_failed",
      tValue: "Failed to check WhatsApp number status",
    },
    whatsapp_not_registered: {
      tKey: "auth:feedback.whatsapp_not_registered",
      tValue: "Phone number not registered or active on WhatsApp",
    },
  },

  input: {
    helper_text: {
      first_name_required: {
        tKey: "auth:input.helper_text.first_name_required",
        tValue: "First name is required",
      },
      last_name_required: {
        tKey: "auth:input.helper_text.last_name_required",
        tValue: "Last name is required",
      },
      otp_verify_code: {
        tKey: "auth:input.helper_text.otp_verify_code",
        tValue: "",
      },
    },
    label: {
      answer: {
        tKey: "auth:input.label.answer",
        tValue: "Enter anwer",
      },
      confirm_password: {
        tKey: "auth:input.label.confirm_password",
        tValue: "Confirm Password",
      },
      email__or_phone: {
        tKey: "auth:input.label.email_or_phone",
        tValue: "Email or Phone",
      },
      email_address: {
        tKey: "auth:input.label.email_address",
        tValue: "Email Address",
      },
      email_phone_username: {
        tKey: "auth:input.label.email_phone_username",
        tValue: "Email, Phone or Username",
      },
      enter_code: {
        tKey: "auth:input.label.enter_code",
        tValue: "Enter code",
      },
      first_name: {
        tKey: "auth:input.label.first_name",
        tValue: "First name",
      },
      last_name: {
        tKey: "auth:input.label.last_name",
        tValue: "Last name",
      },
      otp_verify_code: {
        tKey: "auth:input.label.otp_verify_code",
        tValue: "",
      },
      password: {
        tKey: "auth:input.label.password",
        tValue: "Password",
      },
      phone_number: {
        tKey: "auth:input.label.phone_number",
        tValue: "Phone number",
      },
      phone_optional: {
        tKey: "auth:input.label.phone_optional",
        tValue: "Phone number (Optional)",
      },
      security_question: (index: number) => ({
        tKey: "auth:input.label.security_question",
        tValue: "Security Question {{index}}",
        interpolations: { index },
      }),
      username: {
        tKey: "auth:input.label.username",
        tValue: "Username",
      },
    },
    placeholder: {
      create_password: {
        tKey: "auth:input.placeholder.create_password",
        tValue: "Create password",
      },
      create_username: {
        tKey: "auth:input.placeholder.create_username",
        tValue: "Create username",
      },
      email_or_phone: {
        tKey: "auth:input.placeholder.email_or_phone",
        tValue: "Email address, or phone number",
      },
      email_phone_username: {
        tKey: "auth:input.placeholder.email_phone_username",
        tValue: "Email address, phone or username",
      },
      enter_first_name: {
        tKey: "auth:input.placeholder.enter_first_name",
        tValue: "Enter first name",
      },
      enter_last_name: {
        tKey: "auth:input.placeholder.enter_last_name",
        tValue: "Enter last name",
      },
      enter_password: {
        tKey: "auth:input.placeholder.enter_password",
        tValue: "Password",
      },
      enter_your_email: {
        tKey: "auth:input.placeholder.enter_your_email",
        tValue: "Enter your email",
      },
      phone_example: {
        tKey: "auth:input.placeholder.phone_example",
        tValue: "e.g. +1234567890",
      },
      re_enter_password: {
        tKey: "auth:input.label.re_enter_password",
        tValue: "Re-enter your password",
      },
      select_a_question: {
        tKey: "auth:input.label.select_a_question",
        tValue: "Select a question...",
      },
      type_your_answer: {
        tKey: "auth:input.label.rtype_your_answer",
        tValue: "Type your answer...",
      },
    },
  },

  security_questions: {
    question_1: {
      tKey: "auth:security_questions.question_1",
      tValue: "What is the name of your first pet?",
    },
    question_2: {
      tKey: "auth:security_questions.question_2",
      tValue: "In what city were you born?",
    },
    question_3: {
      tKey: "auth:security_questions.question_3",
      tValue: "What is your mother's maiden name?",
    },
    question_4: {
      tKey: "auth:security_questions.question_4",
      tValue: "What was the name of your primary school?",
    },
    question_5: {
      tKey: "auth:security_questions.question_5",
      tValue: "What was the make of your first car?",
    },
    question_6: {
      tKey: "auth:security_questions.question_6",
      tValue: "What is the title of your favorite book?",
    },
    question_7: {
      tKey: "auth:security_questions.question_7",
      tValue: "In what city did your parents meet?",
    },
    question_8: {
      tKey: "auth:security_questions.question_8",
      tValue: "What is the name of the street you grew up on?",
    },
    question_9: {
      tKey: "auth:security_questions.question_9",
      tValue: "What was the name of your favorite childhood teacher?",
    },
    question_10: {
      tKey: "auth:security_questions.question_10",
      tValue: "What was the model of your first mobile phone?",
    },
  },
} as const;

/**
 * Common layout structures. Extracts to ../../../locale/versions/en/common.json
 */
export const common = {
  button: {
    active_view: (view: string) => ({
      tKey: "common:button.active_view",
      tValue: "{{view}}",
      interpolations: { view },
    }),
    add: (count: number) => ({
      tKey: "common:button.add",
      tValue: "Add {{count}}",
      interpolations: { count },
    }),
    add_selected_media: {
      tKey: "common:button.add_selected_media",
      tValue: "Add",
    },
    back: { tKey: "common:button.back", tValue: "Back" },
    browse_files: {
      tKey: "common:button.browse_files",
      tValue: "Browse...",
    },
    cancel: { tKey: "common:button.back", tValue: "Cancel" },
    continue: { tKey: "common:button.continue", tValue: "Continue" },
    done: { tKey: "common:button.done", tValue: "Done" },
    edit: { tKey: "common:button.edit", tValue: "Edit" },
    emojis: {
      tKey: "common:button.emojis",
      tValue: "Emojis",
    },
    explore_funstakes: {
      tKey: "common:button.explore_funstakes",
      tValue: "Explore Funstakes",
    },
    filter_mode: {
      tKey: "common:button.text_mode",
      tValue: "Filter",
    },
    follow_toggle: (value: string) => ({
      tKey: "common:button.follow_toggle",
      tValue: "{{value}}",
      interpolations: { value },
    }),
    gallery_folder_fallback: {
      tKey: "common:input.label.gallery_folder_fallback",
      tValue: "Gallery",
    },
    get_started: {
      tKey: "common:button.get_started",
      tValue: "Get Started",
    },
    go_home: {
      tKey: "common:button.go_home",
      tValue: "Go Home",
    },
    go_to_funstakes: {
      tKey: "common:button.go_to_funstakes",
      tValue: "Go to funstakes.com",
    },
    grant_permission: {
      tKey: "common:button.grant_permission",
      tValue: "Grant Permission",
    },
    my_profile: {
      tKey: "common:button.my_profile",
      tValue: "My profile",
    },
    preview: { tKey: "common:button.preview", tValue: "Preview" },
    refresh: {
      tKey: "common:button.refresh",
      tValue: "Refresh",
    },
    retry: {
      tKey: "common:button.retry",
      tValue: "Retry",
    },
    request_access: {
      tKey: "common:button.request_access",
      tValue: "Access",
    },
    reset_password: {
      tKey: "common:button.reset_password",
      tValue: "Reset password",
    },
    show_less: {
      tKey: "common:button.show_less",
      tValue: "Show less",
    },
    show_more: {
      tKey: "common:button.show_more",
      tValue: "Show more",
    },
    skip: {
      tKey: "common:button.skip",
      tValue: "Skip",
    },
    status_switcher: {
      tKey: "common:button.status_switcher",
      tValue: "Active now",
    },
    sticker_mode: {
      tKey: "common:button.sticker_mode",
      tValue: "Sticker",
    },
    stickers: {
      tKey: "common:button.stickers",
      tValue: "Stickers",
    },
    switch_mode: {
      tKey: "common:button.switch_mode",
      tValue: "Switch mode",
    },
    text_mode: {
      tKey: "common:button.text_mode",
      tValue: "Text",
    },
    unselect_all: {
      tKey: "common:button.unselect_all",
      tValue: "Unselect all",
    },
    view_terms: {
      tKey: "common:button.view_terms",
      tValue: " View Terms",
    },
  },

  carousel: {
    marketing001: {
      slide1_headline: {
        tKey: "common:carousel.marketing001.slide1_headline",
        tValue: "From idea to final image",
      },
      slide1_name: {
        tKey: "common:carousel.marketing001.slide1_name",
        tValue: "IMAGE",
      },
      slide1_tagline: {
        tKey: "common:carousel.marketing001.slide1_tagline",
        tValue:
          "Complete image workflow: generation, editing, and upscaling with professional control.",
      },
      slide2_headline: {
        tKey: "common:carousel.marketing001.slide2_headline",
        tValue: "Direct every frame",
      },
      slide2_name: {
        tKey: "common:carousel.marketing001.slide2_name",
        tValue: "VIDEO",
      },
      slide2_tagline: {
        tKey: "common:carousel.marketing001.slide2_tagline",
        tValue:
          "Video generation and editing with full creative control, start to finish.",
      },
      slide3_headline: {
        tKey: "common:carousel.marketing001.slide3_headline",
        tValue: "Generate audio for your projects",
      },
      slide3_name: {
        tKey: "common:carousel.marketing001.slide3_name",
        tValue: "AUDIO",
      },
      slide3_tagline: {
        tKey: "common:carousel.marketing001.slide3_tagline",
        tValue:
          "A production of music, voiceovers, and sound effects with the quality your work needs.",
      },
      slide4_headline: {
        tKey: "common:carousel.marketing001.slide4_headline",
        tValue: "Generate assets in 3D",
      },
      slide4_name: {
        tKey: "common:carousel.marketing001.slide4_name",
        tValue: "3D",
      },
      slide4_tagline: {
        tKey: "common:carousel.marketing001.slide4_tagline",
        tValue:
          "Objects, scenes, and environments ready for any of your projects.",
      },
    },
  },

  feedback: {
    access_denied_headline: {
      tKey: "common:feedback.access_denied_headline",
      tValue: "Access Denied",
    },
    access_denied_tagline: {
      tKey: "common:feedback.access_denied_tagline",
      tValue: "You don't have the permissions required to view this page.",
    },
    access_restricted_headline: {
      tKey: "common:feedback.access_restricted_headline",
      tValue: "Access Restricted",
    },
    access_restricted_tagline: {
      tKey: "common:feedback.access_restricted_tagline",
      tValue:
        "You need to be logged in to view this page. Please sign in to continue.",
    },
    connection_timed_out: {
      tKey: "common:feedback.connection_timed_out",
      tValue: "Connection timed out or failed.",
    },
    connection_unstable_tagline: {
      tKey: "common:feedback.connection_unstable_tagline",
      tValue: "Connection unstable.",
    },
    failed_to_translate_dynamic_text: {
      tKey: "common:feedback.failed_to_translate_dynamic_text",
      tValue:
        "Failed to resolve text string from translation response payload. Try again later.",
    },
    file_permission_tagline: {
      tKey: "common:feedback.file_permission_tagline",
      tValue:
        "Grant storage directory read access to view local gallery media items natively.",
    },
    follow_update_failed_tagline: {
      tKey: "common:feedback.follow_update_failed_tagline",
      tValue: "Follow update failed",
    },
    followers: {
      tKey: "common:feedback.followers",
      tValue: "Followers",
    },
    following: {
      tKey: "common:feedback.following",
      tValue: "Following",
    },
    join_funstakes_headline: {
      tKey: "common:feedback.join_funstakes_headline",
      tValue: "Join millions of stakers on {{name}}",
      interpolations: { name: "Funstakes" },
    },
    network_connection_failed: {
      tKey: "common:feedback.network_error",
      tValue: "Network connection failed, try again.",
    },
    network_error_tagline: {
      tKey: "common:feedback.network_error_tagline",
      tValue: "Something went wrong, check your network and retry",
    },
    network_glitch_headline: {
      tKey: "common:feedback.network_glitch_headline",
      tValue: "Oops, something went wrong",
    },
    network_glitch_tagline: {
      tKey: "common:feedback.network_glitch_tagline",
      tValue:
        "Please, check your internet connection and retry again in a few seconds.",
    },
    network_offline_tagline: {
      tKey: "common:feedback.network_offline_tagline",
      tValue: "You are offline.",
    },
    new_to_funstakes: {
      tKey: "common:feedback.new_to_funstakes",
      tValue: "New to Funstakes? <anchor>Sign up</anchor>",
    },
    no_internet_tagline: {
      tKey: "common:feedback.no_internet_tagline",
      tValue: "You are not connected to the internet",
    },
    no_sticker_or_emoji_found: (activeTab: string) => ({
      tKey: "common:feedback.no_sticke_or_emoji_found",
      tValue: " No {{type}} found",
      interpolations: { type: activeTab === "STICKER" ? "stickers" : "emojis" },
    }),
    predict_stake_win: {
      tKey: "common:feedback.predict_stake_win",
      tValue: "Predict. Stake. Win.",
    },
    progress_saved: {
      tKey: "common:feedback.progress_saved",
      tValue: "Your progress has been saved.",
    },
    quote1: {
      tKey: "common:feedback.quote1",
      tValue: "Something Must Be Unique About You",
    },
    remember_me_guide: {
      tKey: "common:feedback.remember_me_guide",
      tValue:
        "Saves your credentials on this device for quick access. Only use on trusted devices.",
    },
    retrieving_connection: {
      tKey: "common:feedback.retrieving_connection",
      tValue: "Retrieving connection...",
    },
    seem_to_be_offline_headline: {
      tKey: "common:feedback.seem_to_be_offline_headline",
      tValue: "You seem to be offline",
    },
    seem_to_be_offline_tagline: {
      tKey: "common:feedback.seem_to_be_offline_tagline",
      tValue: "Switch to offline mode to view offline contents.",
    },
    server_error_headline: {
      tKey: "common:feedback.server_error_headline",
      tValue: "Something went wrong on our end.",
    },
    server_error_tagline: {
      tKey: "common:feedback.server_error_tagline",
      tValue:
        "We encountered an unexpected error on our server. Please refresh the page.",
    },
    server_request_successful: {
      tKey: "common:feedback.server_request_successful",
      tValue: "Server request successful",
    },
    sign_in_to_funstakes: {
      tKey: "common:feedback.sign_in_to_funstakes",
      tValue: "Sign in to Funstakes",
    },
    sync_error: {
      tKey: "common:feedback.sync_error",
      tValue: "An error occurred during sync",
    },
    those_following_you: {
      tKey: "common:feedback.those_following_you",
      tValue: "Those following you",
    },
    trends_missed: {
      tKey: "common:feedback.trends_missed",
      tValue: "Get up to speed",
    },
    under_maintenance_headline: {
      tKey: "common:feedback.under_maintenance_headline",
      tValue: "Under Maintenance",
    },
    under_maintenance_tagline: {
      tKey: "common:feedback.under_maintenance_tagline",
      tValue: "We are making improvements. Please check back shortly.",
    },
    unknown_error: {
      tKey: "common:feedback.unknown_error",
      tValue: "Unknown server error",
    },
    user_no_follower_tagline: {
      tKey: "common:feedback.user_no_follower_tagline",
      tValue: "You don't have followers!",
    },
    user_terms_agreement: {
      tKey: "common:feedback.user_terms_agreement",
      tValue:
        "By continuing, you agree to our <agreement>User Agreement</agreement> and acknowledge that you understand the <policy>Privacy Policy</policy>.",
    },
    welcome_aboard_headline: {
      tKey: "common:feedback.welcome_aboard_headline",
      tValue: "Welcome Aboard {{name}}!",
      interpolations: { name: "Funstaker" },
    },
    welcome_aboard_tagline: {
      tKey: "common:feedback.welcome_aboard_tagline",
      tValue:
        "Nice to have you here. Let's get your profile set up so you can start exploring and winning.",
    },
    welcome_back: (name: string = "") => ({
      tKey: "common:feedback.welcome_back",
      tValue: " Welcome back {{name}}",
      interpolations: { name },
    }),
  },

  input: {
    helper_text: {
      gist_add_caption: {
        tKey: "common:input.helper_text.gist_add_caption",
        tValue: "Type here...",
      },
    },
    label: {
      gist_add_caption: {
        tKey: "common:input.label.gist_add_caption",
        tValue: "What's happening?",
      },
      remember_me: {
        tKey: "common:input.label.remember_me",
        tValue: "Remember me",
      },
    },
    placeholder: {
      choose_media_file: {
        tKey: "common:input.placeholder.choose_media_file",
        tValue: "Choose media file dependencies...",
      },
      gist_add_caption: {
        tKey: "common:input.placeholder.gist_add_caption",
        tValue: "Share your social discovery or insights...",
      },
      media_files_selected: (count: number) => ({
        tKey: "common:input.placeholder.media_files_selected",
        tValue: "{{count}} files selected",
        interpolations: { count },
      }),
      explore: { tKey: "common:input.placeholder.explore", tValue: "Explore" },
      type_here: {
        tKey: "common:input.placeholder.type_here",
        tValue: "Type here...",
      },
      search_library: (activeTab: string) => ({
        tKey: "common:input.placeholder.search_library",
        tValue: "Search {{type}}",
        interpolations: {
          type: activeTab === "STICKER" ? "stickers" : "emojis",
        },
      }),
    },
  },

  input_validation: {
    atleast_one_digit: {
      tKey: "common:input_validation.atleast_one_digit",
      tValue: "Must contain at least one numeric digit",
    },
    atleast_one_special_character: {
      tKey: "common:input_validation.atleast_one_special_character",
      tValue: "Include one special character (e.g., @, $, !)",
    },
    atleast_one_uppercase: {
      tKey: "common:input_validation.atleast_one_uppercase",
      tValue: "Include at least one uppercase letter",
    },
    credential_too_short: {
      tKey: "common:input_validation.credential_too_short",
      tValue: "Credential can't be less than 3 characters.",
    },
    email_domain_double_dot: {
      tKey: "common:input_validation.email_domain_double_dot",
      tValue:
        "Domain part cannot contain consecutive dots (..) such as user@example..com",
    },
    email_domain_too_long: {
      tKey: "common:input_validation.email_domain_too_long",
      tValue: "The domain part is too long.",
    },
    email_invalid_format: {
      tKey: "common:input_validation.email_invalid_format",
      tValue: "Must be a valid email address (user@example.com).",
    },
    email_local_too_long: {
      tKey: "common:input_validation.email_local_too_long",
      tValue: "The part before '@' is too long. (user@example.com)",
    },
    email_required: {
      tKey: "common:input_validation.email_required",
      tValue: "Email is required.",
    },
    email_standard_format: {
      tKey: "common:input_validation.email_standard_format",
      tValue: "Must follow standard email format (e.g., user@example.com)",
    },
    email_valid: {
      tKey: "common:input_validation.email_valid",
      tValue: "Valid email address.",
    },
    field_is_required: {
      tKey: "common:input_validation.field_is_required",
      tValue: "This field is required.",
    },
    invalid_input_value: {
      tKey: "common:input_validation.invalid_input_value",
      tValue: "Enter a valid value",
    },
    length_range_3_to_25: {
      tKey: "common:input_validation.length_range_3_to_25",
      tValue: "Length must be between 3 and 25 characters",
    },
    minimum_8_characters: {
      tKey: "common:input_validation.minimum_8_characters",
      tValue: "Minimum 8 characters in length",
    },
    name_length_error: (label: string) => ({
      tKey: "common:input_validation.name_length_error",
      tValue: "{{label}} must be between 2 and 40 characters.",
      interpolations: { label },
    }),
    name_numeric_only_error: (label: string) => ({
      tKey: "common:input_validation.name_numeric_only_error",
      tValue: "{{label}} cannot consist of numbers only.",
      interpolations: { label },
    }),
    only_letters_numbers_underscores: {
      tKey: "common:input_validation.only_letters_numbers_underscores",
      tValue: "Only letters, numbers, and underscores (_) are allowed",
    },
    password_missing_lowercase: {
      tKey: "common:input_validation.password_missing_lowercase",
      tValue:
        "Password must include at least one lowercase letter. (example: Abcd1234#)",
    },
    password_missing_number: {
      tKey: "common:input_validation.password_missing_number",
      tValue: "Password must include at least one number. (example: Abcd1234#)",
    },
    password_missing_special: {
      tKey: "common:input_validation.password_missing_special",
      tValue:
        "Password must include at least one special character (!@#$%^&*). (example: Abcd1234#)",
    },
    password_missing_uppercase: {
      tKey: "common:input_validation.password_missing_uppercase",
      tValue:
        "Password must include at least one uppercase letter. (example: Abcd1234#)",
    },
    password_required: {
      tKey: "common:input_validation.password_required",
      tValue: "Password is required. (example: Abcd1234#)",
    },
    password_strong: {
      tKey: "common:input_validation.password_strong",
      tValue: "Strong password.",
    },
    password_too_short: {
      tKey: "common:input_validation.password_too_short",
      tValue:
        "Password must be at least 8 characters long. (example: Abcd1234#)",
    },
    phone_international_format: {
      tKey: "common:input_validation.phone_international_format",
      tValue: "Supports international formats (+, brackets, hyphens)",
    },
    phone_invalid_chars: {
      tKey: "common:input_validation.phone_invalid_chars",
      tValue: "Phone number contains invalid characters.",
    },
    phone_length_range: {
      tKey: "common:input_validation.phone_length_range",
      tValue: "Must contain between 10 and 15 digits",
    },
    phone_required: {
      tKey: "common:input_validation.phone_required",
      tValue: "Phone number is required.",
    },
    phone_too_long: {
      tKey: "common:input_validation.phone_too_long",
      tValue: "Phone number is too long. (Maximum 15 digits)",
    },
    phone_too_short: {
      tKey: "common:input_validation.phone_too_short",
      tValue: "Phone number is too short. (Minimum 10 digits)",
    },
    phone_valid: {
      tKey: "common:input_validation.phone_valid",
      tValue: "Valid phone number format.",
    },
    start_with_letter: {
      tKey: "common:input_validation.start_with_letter",
      tValue: "Must start with a letter (a-z, A-Z)",
    },
    username_invalid_chars: {
      tKey: "common:input_validation.username_invalid_chars",
      tValue: "Only letters, numbers, and underscores are allowed as username.",
    },
    username_length_error: {
      tKey: "common:input_validation.username_length_error",
      tValue: "Username must be between 3 and 25 characters.",
    },
    username_start_letter_error: {
      tKey: "common:input_validation.username_start_letter_error",
      tValue: "Username must start with a letter.",
    },
    username_valid: {
      tKey: "common:input_validation.username_valid",
      tValue: "Username format is valid.",
    },
  },

  list_item: {
    msg: {
      country_empty: {
        tKey: "common:list_item.msg.country_empty",
        tValue: "No country found.",
      },
      country_no_match: {
        tKey: "common:list_item.msg.country_no_match",
        tValue: "No country matches your search.",
      },
      default_empty: {
        tKey: "common:list_item.msg.default_empty",
        tValue: "No items found.",
      },
      default_no_match: {
        tKey: "common:list_item.msg.default_no_match",
        tValue: "No results match your search.",
      },
      navigation_empty: {
        tKey: "common:list_item.msg.navigation_empty",
        tValue: "Navigation menu is empty.",
      },
      navigation_no_match: {
        tKey: "common:list_item.msg.navigation_no_match",
        tValue: "No menu items found.",
      },
      topics_empty: {
        tKey: "common:list_item.msg.topics_empty",
        tValue: "Add topics to this post.",
      },
      topics_no_match: {
        tKey: "common:list_item.msg.topics_no_match",
        tValue: "No matching topics.",
      },
    },
    nav: {
      about: { tKey: "common:list_item.nav.about", tValue: "About" },
      blogs: { tKey: "common:list_item.nav.blogs", tValue: "Blogs" },
      bookmarks: {
        tKey: "common:list_item.nav.bookmarks",
        tValue: "Bookmarks",
      },
      explore: { tKey: "common:list_item.nav.explore", tValue: "Explore" },
      home: { tKey: "common:list_item.nav.home", tValue: "Home" },
      inbox: { tKey: "common:list_item.nav.inbox", tValue: "Inbox" },
      login: { tKey: "common:list_item.nav.login", tValue: "Login" },
      news: { tKey: "common:list_item.nav.news", tValue: "News" },
      notifications: {
        tKey: "common:list_item.nav.notifications",
        tValue: "Notifications",
      },
      offline: { tKey: "common:list_item.nav.offline", tValue: "Offline" },
      onboarding: {
        tKey: "common:list_item.nav.onboarding",
        tValue: "Onboarding",
      },
      pricing: { tKey: "common:list_item.nav.pricing", tValue: "Pricing" },
      privacy: { tKey: "common:list_item.nav.privacy", tValue: "Privacy" },
      profile: { tKey: "common:list_item.nav.profile", tValue: "Profile" },
      restoreAccount: {
        tKey: "common:list_item.nav.restoreAccount",
        tValue: "Restore Account",
      },
      settings: { tKey: "common:list_item.nav.settings", tValue: "Settings" },
      signup: { tKey: "common:list_item.nav.signup", tValue: "Signup" },
      support: { tKey: "common:list_item.nav.support", tValue: "Support" },
      terms: { tKey: "common:list_item.nav.terms", tValue: "Terms" },
      verifyIdentity: {
        tKey: "common:list_item.nav.verifyOtp",
        tValue: "Verify Identity",
      },
      wallet: { tKey: "common:list_item.nav.wallet", tValue: "Wallet" },
    },
  },

  media: {
    added_media: (count: number) => ({
      tKey: "common:media.added_media",
      tValue: "Added media {{count}}",
      interpolations: { count },
    }),
    gallery_counter: (current: number | string, total: number | string) => ({
      tKey: "common:media.gallery_counter",
      tValue: "{{current}} / {{total}}",
      interpolations: { current, total },
    }),
    gallery_default_name: {
      tKey: "common:media.gallery_default_name",
      tValue: "Gallery Library",
    },
    media_transfer_progress: {
      tKey: "common:media.media_transfer_progress",
      tValue: "Transfer in Progress",
    },
    media_video_optimization: {
      tKey: "common:media.media_video_optimization",
      tValue: "Please wait for video optimization processing to complete.",
    },

    recently_viewed_media: {
      tKey: "common:media.remaining_count",
      tValue: "Recently Viewed Images & Videos",
    },
    remaining_count: (count: number) => ({
      tKey: "common:media.remaining_count",
      tValue: "+{{count}}",
      interpolations: { count },
    }),
    source_type_audio: {
      tKey: "common:media.source_type_audio",
      tValue: "Audio",
    },
    source_type_image: {
      tKey: "common:media.source_type_image",
      tValue: "Image",
    },
    source_type_video: {
      tKey: "common:media.source_type_video",
      tValue: "Video",
    },
    track_upload_progress: (currentProgress: number | string) => ({
      tKey: "common:media.track_upload_progress",
      tValue: "Optimizing {{currentProgress}}%",
      interpolations: { currentProgress },
    }),
    upload_error: (fileName: string = "File", error: string) => ({
      tKey: "common:media.upload_error",
      tValue: "<span><strong>{{fileName}}</strong>: {{error}}</span>",
      interpolations: { fileName, error },
    }),
    upload_success: (fileName: string = "File") => ({
      tKey: "common:media.upload_success",
      tValue:
        " <span><strong>{{fileName}}</strong>: successfully uploaded</span>",
      interpolations: { fileName },
    }),
    uploading: (fileName: string = "File") => ({
      tKey: "common:media.uploading",
      tValue:
        " <span><strong>{{fileName}}</strong>: uploading in progress</span>",
      interpolations: { fileName },
    }),
    verifying_content_safeties: {
      tKey: "common:media.uploading",
      tValue: "Verifying Content Safeties",
    },
  },

  tour_guides: {
    new_user_begin_desc: {
      tKey: "common:tour_guides.new_user_begin_desc",
      tValue: "Let's get you started",
    },
    new_user_begin_label: {
      tKey: "common:tour_guides.new_user_begin_label",
      tValue: "Welcome to the platform!",
    },
    new_user_post_desc: {
      tKey: "common:tour_guides.new_user_post_desc",
      tValue: "To create a post, simply use the icon in the sidebar.",
    },
    new_user_post_label: {
      tKey: "common:tour_guides.new_user_post_label",
      tValue: "Create a post",
    },
  },
} as const;

/**
 * Post workflow components. Extracts to ../../../locale/versions/en/post.json
 */
export const post = {
  button: {
    add_image: { tKey: "post:button.add_image", tValue: "Image" },
    add_video: { tKey: "post:button.add_video", tValue: "Video" },
    create_post: { tKey: "post:button.create_post", tValue: "Create" },
    post_add_topic: {
      tKey: "post:button.post_add_topic",
      tValue: "Add Topics",
    },
    post_back: { tKey: "post:button.post_back", tValue: "Back" },
    post_next: { tKey: "post:button.post_next", tValue: "Next" },
    post_submit: (postType: string = "Post") => ({
      tKey: "post:button.post_submit",
      tValue: "Publish {{postType}}",
      interpolations: { postType },
    }),
    syncing_post: {
      tKey: "post:button.syncing_post",
      tValue: "Syncing post...",
    },
  },

  feedback: {
    categorization_taxonomy: {
      tKey: "post:feedback.categorization_taxonomy",
      tValue: "Categorization Taxonomy",
    },
    compose_post: (postType: string = "Post") => ({
      tKey: "post:feedback.compost_post",
      tValue: "Compose {{postType}}",
      interpolations: { postType },
    }),
    content_rejected_headline: {
      tKey: "post:feedback.content_rejected_headline",
      tValue: "Content Rejected",
    },
    content_rejected_tagline: (reason: string) => ({
      tKey: "post:feedback.content_rejected_tagline",
      tValue: "Post content rejected due to: {{reason}}",
      interpolations: { reason },
    }),
    content_violation_tagline: {
      tKey: "post:feedback.content_violation_tagline",
      tValue: "Your post content violated automated community guidelines.",
    },
    creation_failed_tagline: (postType: string) => ({
      tKey: "post:feedback.creation_failed_tagline",
      tValue: "{{postType}} Creation Failed",
      interpolations: { postType },
    }),
    filter_feed: {
      tKey: "post:feedback.filter_feed",
      tValue: "Filter feed",
    },
    like_sync_failed_tagline: {
      tKey: "post:feedback.like_sync_failed_tagline",
      tValue: "Post like failed",
    },
    login_engage_tagline: {
      tKey: "post:feedback.login_engage_tagline",
      tValue: "Login to engage",
    },
    network_mode_offline_tagline: {
      tKey: "post:feedback.network_mode_offline_tagline",
      tValue: "Post is offline.",
    },
    no_post_found_tagline: (postType: string = "Post") => ({
      tKey: "post:feedback.gist_empty_tagline",
      tValue: "No  {{postType}}s found in cache or online.",
      interpolations: { postType },
    }),
    offline_feed_empty_headline: {
      tKey: "common:feedback.offline_feed_empty_headline",
      tValue: "No offline posts",
    },
    offline_feed_empty_tagline: {
      tKey: "common:feedback.offline_feed_empty_tagline",
      tValue: "Can't find any post at this time.",
    },
    post_content_validation: (postType: string = "Post") => ({
      tKey: "post:feedback.post_content_validation",
      tValue: "{{postType}} must contain either text content or media.",
      interpolations: { postType },
    }),
    post_deleted_tagline: {
      tKey: "common:feedback.post_deleted_tagline",
      tValue: "Post deleted by author.",
    },
    post_settings: (postType: string = "Post") => ({
      tKey: "post:feedback.post_settings",
      tValue: "{{postType}} Settings",
      interpolations: { postType },
    }),
    post_type_not_found: {
      tKey: "post:feedback.post_type_not_found",
      tValue: "Post type not found.",
    },
    processing_complete_headline: {
      tKey: "post:feedback.processing_complete_headline",
      tValue: "Processing Complete",
    },
    processing_complete_tagline: (postType: string) => ({
      tKey: "post:feedback.processing_complete_tagline",
      tValue: "Your {{postType}} has been successfully processed.",
      interpolations: { postType },
    }),
    publication_error_tagline: {
      tKey: "post:feedback.publication_error_tagline",
      tValue: "An error occurred during post media processing.",
    },
    published_success_tagline: (postType: string) => ({
      tKey: "post:feedback.published_success_tagline",
      tValue: "{{postType}} published successfully.",
      interpolations: { postType },
    }),
  },

  info: {
    post_likes_many: (likes: string) => ({
      tKey: "post:info.post_likes_many",
      tValue: "{{likes}} likes",
      interpolations: { likes },
    }),
    post_likes_one: (like: string) => ({
      tKey: "post:info.post_likes_one",
      tValue: "{{like}} like",
      interpolations: { like },
    }),
    post_views_many: (views: string) => ({
      tKey: "post:info.post_views_many",
      tValue: "{{views}} views",
      interpolations: { views },
    }),
    post_views_one: (view: string) => ({
      tKey: "post:info.post_views_one",
      tValue: "{{view}} view",
      interpolations: { view },
    }),
    topic_post_count: (count: string) => ({
      tKey: "post:info.topic_post_count",
      tValue: "{{count}}",
      interpolations: { count },
    }),
  },

  input: {
    label: {
      create_post: (name: string = "") => ({
        tKey: "post:input.label.create_post",
        tValue: "{{name}} express yourself today...",
        interpolations: { name },
      }),
      flag_sensitive_graphics: {
        tKey: "post:input.label.flag_sensitive_graphics",
        tValue: "Flag sensitive graphics (blur preview)",
      },
      whats_happening: {
        tKey: "post:input.label.whats_happening",
        tValue: "What's happening?",
      },
    },
    placeholder: {
      share_your_thought: {
        tKey: "post:input.placeholder.share_your_thought",
        tValue: "Share your social discovery or insights...",
      },
    },
  },
} as const;

export const MESSAGE_REGISTRY = {
  auth,
  common,
  post,
} satisfies TranslationRegistry;

export const COMMON_FEEDBACK = MESSAGE_REGISTRY.common.feedback;
export const COMMON_BUTTON_LABELS = MESSAGE_REGISTRY.common.button;
export const COMMON_LIST = MESSAGE_REGISTRY.common.list_item;
export const COMMON_INPUT = MESSAGE_REGISTRY.common.input;
export const COMMON_INPUT_VALIDATION = MESSAGE_REGISTRY.common.input_validation;
export const COMMON_MEDIA = MESSAGE_REGISTRY.common.media;
export const COMMON_CAROUSEL = MESSAGE_REGISTRY.common.carousel;
export const COMMON_TOUR_GUIDES = MESSAGE_REGISTRY.common.tour_guides;

export const AUTH_FEEDBACK = MESSAGE_REGISTRY.auth.feedback;
export const AUTH_SECURITY_QUESTIONS = MESSAGE_REGISTRY.auth.security_questions;
export const AUTH_INPUT = MESSAGE_REGISTRY.auth.input;
export const AUTH_BUTTON_LABELS = MESSAGE_REGISTRY.auth.button;

export const POST_FEEDBACK = MESSAGE_REGISTRY.post.feedback;
export const POST_BUTTON_LABELS = MESSAGE_REGISTRY.post.button;
export const POST_INFO = MESSAGE_REGISTRY.post.info;
export const POST_INPUT = MESSAGE_REGISTRY.post.input;
