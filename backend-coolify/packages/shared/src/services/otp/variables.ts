export interface AppInfo {
  appName?: string;
  supportEmail?: string;
  domainUrl?: string;
  logoUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  unsubscribeUrl?: string;
  currentYear?: string;
}

export interface RecipientInfo {
  email: string;
  firstName?: string;
  lastName?: string;
  userIp?: string;
}

export interface CodePayload {
  digit1: string;
  digit2: string;
  digit3: string;
  digit4: string;
  digit5: string;
  digit6: string;
}

export interface EmailOtpParams {
  code: string;
  recipient: RecipientInfo;
  expiresInMinutes?: number;
  templateId?: string;
}

/**
 * Payload interface grouping brand, recipient, code, and system metadata.
 */
export interface EmailOtpPayload {
  recipient: RecipientInfo;
  appInfo: AppInfo;
  code: CodePayload;
  verificationUrl?: string;
  expiresInMinutes?: number;
}

const APP_NAME = "Funstakes";
const DOMAIN_URL = "https://funstakes.net";
const SUPPORT_EMAIL = "support@funstakes.net";
const LOGO_URL =
  "https://media.funstakes.net/assets/logo-name-tagline-light.png";

export const APP_INFO: AppInfo = {
  appName: APP_NAME,
  supportEmail: SUPPORT_EMAIL,
  logoUrl: LOGO_URL,
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://x.com",
  instagramUrl: "https://instagram.com",
  linkedinUrl: "https://linkedin.com",
  playStoreUrl: "https://play.google.com/store",
  appStoreUrl: "https://apps.apple.com",
  unsubscribeUrl: `${DOMAIN_URL}/unsubscribe`,
  currentYear: new Date().getFullYear().toString(),
};

/**
 * Builds the verification email template payload using nested brand and recipient objects.
 */
export function getEmailOtpVariables({
  code,
  recipient,
  expiresInMinutes = 10,
}: EmailOtpParams): EmailOtpPayload {
  const digits = code.split("");

  return {
    recipient: {
      email: recipient.email || "",
      firstName: recipient.firstName || "Funstaker ",
    },
    appInfo: APP_INFO,
    code: {
      digit1: digits[0] || "",
      digit2: digits[1] || "",
      digit3: digits[2] || "",
      digit4: digits[3] || "",
      digit5: digits[4] || "",
      digit6: digits[5] || "",
    },
    verificationUrl: `${DOMAIN_URL}/verify?code=${code}`,
    expiresInMinutes,
  };
}
