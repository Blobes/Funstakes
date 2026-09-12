// 1. Define allowed formats
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov
  "image/gif",
] as const;

// 2. Define size limits (100MB)
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

// 3. Helper to get extension from mime type (useful for S3 keys)
export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/gif": "gif",
};

// Create a type from the array for strict TypeScript checking
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const IDENTIFIER_TYPES = {
  EMAIL: "Email",
  PHONE_NUMBER: "Phone Number",
} as const;

export const VERIFY_IDENTITY_METHODS = {
  MESSAGING: "OTP Messaging",
  TOTP: "Authenticator",
  SECURITY_QUESTIONS: "Security Questions",
} as const;

export const MESSAGING_CHANNELS = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
} as const;

export const ALLOWED_VERIFICATION_METHODS = {
  ...VERIFY_IDENTITY_METHODS,
  ...MESSAGING_CHANNELS,
} as const;

export const SNACKBAR_DURATION = {
  SECS_6: 6,
} as const;
