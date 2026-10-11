/**
 * Shared Location Nested Field Path Constants
 */
export const LOCATION_NESTED_FIELDS = {
  LOCATION_NAME: "location.name",
  LOCATION_CITY: "location.city",
  LOCATION_STATE: "location.state",
  LOCATION_COUNTRY: "location.country",
  LOCATION_TYPE: "location.type",
  LOCATION_COORDINATES: "location.coordinates",
} as const;

/**
 * Public Figure Nested Field Path Constants
 */
export const PUBLIC_FIGURE_NESTED_FIELDS = {
  // --- SIGNALS ---
  SIGNALS_HAS_WIKIPEDIA: "signals.hasWikipedia",
  SIGNALS_IS_VIP_EMAIL: "signals.isVipEmail",
  SIGNALS_IS_VIP_PHONE: "signals.isVipPhone",
  SIGNALS_HAS_PRESS_COVERAGE: "signals.hasPressCoverage",
  SIGNALS_IS_SEARCH_VERIFIED: "signals.isSearchVerified",
} as const;

/**
 * User Nested Field Path Constants
 */
export const USER_NESTED_FIELDS = {
  // --- TOTP AUTHENTICATION ---
  TOTP_AUTH_SECRET: "totpAuth.secret",
  TOTP_AUTH_BACKUP_CODES: "totpAuth.backupCodes",
  TOTP_AUTH_TEMP_SECRET: "totpAuth.tempSecret",
  TOTP_AUTH_TEMP_BACKUP_CODES: "totpAuth.tempBackupCodes",

  // --- KYC VERIFICATION ---
  KYC_ID: "kyc.kycId",
  KYC_CURRENT_TIER: "kyc.currentTier",

  // --- VERIFIED BADGE ---
  VERIFIED_BADGE_ID: "verifiedBadge.badgeId",
  VERIFIED_BADGE_IS_ELIGIBLE: "verifiedBadge.isEligible",

  // --- PUBLIC FIGURE INFO & SIGNALS ---
  PUBLIC_FIGURE_INFO_PUBLIC_FIGURE_ID: "publicFigureInfo.publicFigureId",
  PUBLIC_FIGURE_INFO_IS_NOTABLE: "publicFigureInfo.isNotable",
  PUBLIC_FIGURE_INFO_SIGNALS_HAS_WIKIPEDIA:
    "publicFigureInfo.signals.hasWikipedia",
  PUBLIC_FIGURE_INFO_SIGNALS_IS_VIP_EMAIL:
    "publicFigureInfo.signals.isVipEmail",
  PUBLIC_FIGURE_INFO_SIGNALS_IS_VIP_PHONE:
    "publicFigureInfo.signals.isVipPhone",

  // --- ACCOUNT LOCATION ---
  ...LOCATION_NESTED_FIELDS,
  LOCATION_REGION: "location.region",
  LOCATION_CONTINENT: "location.continent",
  LOCATION_CONTINENT_CODE: "location.continentCode",
  LOCATION_IS_VPN_OR_PROXY: "location.isVpnOrProxy",
  LOCATION_LAST_VERIFIED_AT: "location.lastVerifiedAt",
} as const;

/**
 * Type-safe path accessor mappings for Device schema fields and subdocuments.
 */
export const DEVICE_NESTED_FIELDS = {
  USERS_USER_ID: "users.userId",
  USERS_IS_PRIMARY: "users.isPrimary",
  USERS_IS_VERIFIED: "users.isVerified",
  USERS_POSITIONAL_IS_PRIMARY: "users.$.isPrimary",
  USERS_POSITIONAL_IS_VERIFIED: "users.$.isVerified",
} as const;

/**
 * Shared Moderation Case Nested Field Path Constants
 */
export const MODERATION_CASE_NESTED_FIELDS = {
  MODERATION_CASE_ID: "moderationCase.caseId",
  MODERATION_CASE_COUNT: "moderationCase.caseCount",
} as const;

/**
 * Shared Post Nested Field Path Constants
 */
export const POST_NESTED_FIELDS = {
  // --- LATEST CAPTION ---
  LATEST_CAPTION_ID: "latestCaption.captionId",
  LATEST_CAPTION: "latestCaption.caption",
  LATEST_CAPTION_DETECTED_LANGUAGE: "latestCaption.detectedLanguage",
  LATEST_CAPTION_CREATED_AT: "latestCaption.createdAt",

  // --- LOCATION ---
  ...LOCATION_NESTED_FIELDS,

  // --- MODERATION CASE ---
  ...MODERATION_CASE_NESTED_FIELDS,
} as const;

/**
 * Media Nested Field Path Constants
 */
export const MEDIA_NESTED_FIELDS = {
  // --- DIMENSIONS ---
  DIMENSIONS_WIDTH: "dimensions.width",
  DIMENSIONS_HEIGHT: "dimensions.height",
  DIMENSIONS_ASPECT_RATIO: "dimensions.aspectRatio",

  // --- CUSTOMIZATIONS ---
  CUSTOMIZATIONS_TEXTS_ON_MEDIA: "customizations.textsOnMedia",
  CUSTOMIZATIONS_FILTER: "customizations.filter",
  CUSTOMIZATIONS_STICKERS_ON_MEDIA: "customizations.stickersOnMedia",

  // --- MODERATION CASE ---
  ...MODERATION_CASE_NESTED_FIELDS,
} as const;

/**
 * Security Question Nested Field Path Constants
 */
export const SECURITY_QUESTION_NESTED_FIELDS = {
  QUESTION: "questions.question",
  QUESTIONS_ANSWER_HASH: "questions.answerHash",
} as const;

/**
 * User Settings Nested Field Path Constants
 */
export const USER_SETTINGS_NESTED_FIELDS = {
  // --- PRIVACY ---
  PRIVACY_IS_PRIVATE_ACCOUNT: "privacy.isPrivateAccount",
  PRIVACY_DISCOVERABILITY_SEARCH_INDEXING:
    "privacy.discoverability.searchIndexing",
  PRIVACY_DISCOVERABILITY_CONTACT_SYNC: "privacy.discoverability.contactSync",
  PRIVACY_DISCOVERABILITY_RECOMMEND_TO_OTHERS:
    "privacy.discoverability.recommendToOthers",
  PRIVACY_DIRECT_MESSAGING: "privacy.directMessaging",
  PRIVACY_MENTIONS_AND_TAGGING: "privacy.mentionsAndTagging",

  // --- NOTIFICATIONS ---
  NOTIFICATIONS_PUSH_ENABLED: "notifications.push.enabled",
  NOTIFICATIONS_PUSH_LIKES: "notifications.push.likes",
  NOTIFICATIONS_PUSH_COMMENTS: "notifications.push.comments",
  NOTIFICATIONS_PUSH_MENTIONS: "notifications.push.mentions",
  NOTIFICATIONS_PUSH_NEW_FOLLOWERS: "notifications.push.newFollowers",
  NOTIFICATIONS_PUSH_DIRECT_MESSAGES: "notifications.push.directMessages",
  NOTIFICATIONS_PUSH_SYSTEM_ANNOUNCEMENTS:
    "notifications.push.systemAnnouncements",

  NOTIFICATIONS_EMAIL_ENABLED: "notifications.email.enabled",
  NOTIFICATIONS_EMAIL_DIGEST: "notifications.email.digest",
  NOTIFICATIONS_EMAIL_DIRECT_MESSAGES: "notifications.email.directMessages",
  NOTIFICATIONS_EMAIL_SECURITY_ALERTS: "notifications.email.securityAlerts",

  NOTIFICATIONS_QUIET_MODE_IS_ENABLED: "notifications.quietMode.isEnabled",
  NOTIFICATIONS_QUIET_MODE_START_TIME: "notifications.quietMode.startTime",
  NOTIFICATIONS_QUIET_MODE_END_TIME: "notifications.quietMode.endTime",
  NOTIFICATIONS_QUIET_MODE_TIME_ZONE: "notifications.quietMode.timeZone",

  // --- DISPLAY ---
  DISPLAY_THEME: "display.theme",
  DISPLAY_SHOW_SENSITIVE_MEDIA: "display.showSensitiveMedia",

  DISPLAY_ACCESSIBILITY: "display.accessibility",
  DISPLAY_ACCESSIBILITY_REDUCE_MOTION: "display.accessibility.reduceMotion",
  DISPLAY_ACCESSIBILITY_HIGH_CONTRAST: "display.accessibility.highContrast",
  DISPLAY_ACCESSIBILITY_FONT_SCALE: "display.accessibility.fontScale",
  DISPLAY_ACCESSIBILITY_AUTO_PLAY_MEDIA: "display.accessibility.autoPlayMedia",

  DISPLAY_LOCALIZATION: "display.localization",
  DISPLAY_LOCALIZATION_LANGUAGE: "display.localization.language",
  DISPLAY_LOCALIZATION_CURRENCY: "display.localization.currency",

  DISPLAY_CONTENT_PREFERENCES_PREFERRED_TOPICS:
    "display.contentPreferences.preferredTopics",
  DISPLAY_CONTENT_PREFERENCES_PREFERRED_TOPICS_TOPIC_ID:
    "display.contentPreferences.preferredTopics.topicId",
  DISPLAY_CONTENT_PREFERENCES_PREFERRED_TOPICS_TITLE:
    "display.contentPreferences.preferredTopics.title",
  DISPLAY_CONTENT_PREFERENCES_PREFERRED_TOPICS_ADDED_BY:
    "display.contentPreferences.preferredTopics.addedBy",
  DISPLAY_CONTENT_PREFERENCES_PREFERRED_TOPICS_LAST_VIEWED:
    "display.contentPreferences.preferredTopics.lastViewed",
  DISPLAY_CONTENT_PREFERENCES_MUTED_WORDS:
    "display.contentPreferences.mutedWords",
} as const;

/**
 * KYC Request Nested Field Path Constants
 */
export const KYC_REQUEST_NESTED_FIELDS = {
  // --- PROOFS ROOT ---
  PROOFS_IDENTITY: "proofs.identity",
  PROOFS_ADDRESS: "proofs.address",
  PROOFS_BUSINESS: "proofs.business",
  PROOFS_FINANCE: "proofs.finance",

  // --- PROOFS IDENTITY ---
  PROOFS_IDENTITY_MEDIA_CONTENT: "proofs.identity.mediaContent",
  PROOFS_IDENTITY_TEXT_CONTENT: "proofs.identity.textContent",
  PROOFS_IDENTITY_CONTENT_TYPE: "proofs.identity.contentType",
  PROOFS_IDENTITY_SUBMIT_METHOD: "proofs.identity.submitMethod",
  PROOFS_IDENTITY_SELFIES: "proofs.identity.selfies",
  PROOFS_IDENTITY_REVIEW_STATUS: "proofs.identity.reviewStatus",
  PROOFS_IDENTITY_SUBMITTED_AT: "proofs.identity.submittedAt",

  // --- PROOFS ADDRESS ---
  PROOFS_ADDRESS_MEDIA_CONTENT: "proofs.address.mediaContent",
  PROOFS_ADDRESS_TEXT_CONTENT: "proofs.address.textContent",
  PROOFS_ADDRESS_CONTENT_TYPE: "proofs.address.contentType",
  PROOFS_ADDRESS_SUBMIT_METHOD: "proofs.address.submitMethod",
  PROOFS_ADDRESS_REVIEW_STATUS: "proofs.address.reviewStatus",
  PROOFS_ADDRESS_SUBMITTED_AT: "proofs.address.submittedAt",

  // --- PROOFS BUSINESS ---
  PROOFS_BUSINESS_MEDIA_CONTENT: "proofs.business.mediaContent",
  PROOFS_BUSINESS_TEXT_CONTENT: "proofs.business.textContent",
  PROOFS_BUSINESS_CONTENT_TYPE: "proofs.business.contentType",
  PROOFS_BUSINESS_SUBMIT_METHOD: "proofs.business.submitMethod",
  PROOFS_BUSINESS_REVIEW_STATUS: "proofs.business.reviewStatus",
  PROOFS_BUSINESS_SUBMITTED_AT: "proofs.business.submittedAt",

  // --- PROOFS FINANCE ---
  PROOFS_FINANCE_BANK_NAME: "proofs.finance.bankName",
  PROOFS_FINANCE_ACCOUNT_NAME: "proofs.finance.accountName",
  PROOFS_FINANCE_ACCOUNT_NUMBER: "proofs.finance.accountNumber",
  PROOFS_FINANCE_TIN: "proofs.finance.tin",
  PROOFS_FINANCE_REVIEW_STATUS: "proofs.finance.reviewStatus",
  PROOFS_FINANCE_SUBMITTED_AT: "proofs.finance.submittedAt",
} as const;
