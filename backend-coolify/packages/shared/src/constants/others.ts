import { SubscriptionTier } from "@repo/database";

// 1. Define allowed formats
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov
  "image/gif",
] as const;

// 2. Define size limits (50MB)
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50mb

// 3. Helper to get extension from mime type (useful for S3 keys)
export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/gif": "gif",
};

export const TIER_WEIGHTS: Record<SubscriptionTier, number> = {
  FREE: 0,
  PREMIUM: 1,
  ENTERPRISE: 2,
};

// Create a type from the array for strict TypeScript checking
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const ISO_MAP: Record<string, string> = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  cmn: "zh", // Mandarin / Chinese
  jpn: "ja",
  arb: "ar",
  rus: "ru",
};
/**
 * Converts a 3-letter language code to a 2-letter fallback code.
 */
export const to2ISOCode = (threeLetterCode: string): string => {
  return ISO_MAP[threeLetterCode] || "en"; // Default fallback to English if text is ambiguous
};

/**
 * Mapping of Cloudflare 2-letter continent codes to full names.
 */
export const CONTINENT_NAME_MAP = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
} as const satisfies Record<string, string>;

/**
 * Generic HTTP header keys for IP, location, and client metadata.
 */
export const HTTP_REQ_HEADERS = {
  // IP, Location & Geo
  COUNTRY: "cf-ipcountry",
  CITY: "cf-ipcity",
  REGION: "cf-region",
  REGION_CODE: "cf-region-code",
  CONTINENT: "cf-continent",
  LATITUDE: "cf-iplatitude",
  LONGITUDE: "cf-iplongitude",
  TIMEZONE: "cf-timezone",
  CONNECTING_IP: "cf-connecting-ip",
  CLIENT_TIMEZONE: "x-client-timezone",
  XFF: "x-forwarded-for",
  X_REAL_IP: "x-real-ip",

  // Rate Limit
  X_RATE_LIMIT: "X-RateLimit-Limit",
  X_RATE_LIMIT_REMAINING: "X-RateLimit-Remaining",

  // User
  USER_ID: "x-user-id",
  USER_EMAIL: "x-user-email",
  USER_ROLES: "x-user-roles",
  SUBSCRIPTION_TIER: "x-subscription-tier",
  SUBSCRIPTION_STATUS: "x-subscription-status",
  DEVICE_ID: "x-device-id",
  SESSION_ID: "x-session-id",
} as const;

/**
 * Datacenter and hosting provider keywords commonly associated with VPNs.
 */
export const DATACENTER_ISP_PATTERNS = [
  "m247",
  "datacamp",
  "digitalocean",
  "linode",
  "vultr",
  "choopa",
  "ovh",
  "leaseweb",
  "hetzner",
  "expressvpn",
  "nordvpn",
  "surfshark",
  "cyberghost",
  "proton",
  "tzulo",
  "packet",
] as const;

/**
 * Map of African country names to their calling code prefixes.
 */
export const AFRICAN_PHONE_CODE_MAP = {
  // West Africa
  Nigeria: "234",
  Ghana: "233",
  "Ivory Coast": "225",
  Senegal: "221",
  Liberia: "231",
  "Sierra Leone": "232",
  Togo: "228",
  Benin: "229",
  "Burkina Faso": "226",
  Gambia: "220",
  Guinea: "224",
  "Guinea-Bissau": "245",
  Mali: "223",
  Niger: "227",
  "Cape Verde": "238",

  // East Africa
  Kenya: "254",
  Uganda: "256",
  Tanzania: "255",
  Rwanda: "250",
  Ethiopia: "251",
  Burundi: "257",
  Somalia: "252",
  "South Sudan": "211",
  Djibouti: "253",
  Comoros: "269",
  Mauritius: "230",
  Seychelles: "248",

  // Southern Africa
  "South Africa": "27",
  Zambia: "260",
  Zimbabwe: "263",
  Botswana: "267",
  Namibia: "264",
  Malawi: "265",
  Mozambique: "258",
  Lesotho: "266",
  Eswatini: "268",

  // Central Africa
  Cameroon: "237",
  "Republic of the Congo": "242",
  "Democratic Republic of the Congo": "243",
  Gabon: "241",
  Chad: "235",
  "Central African Republic": "236",
  "Equatorial Guinea": "240",
  "São Tomé and Príncipe": "239",

  // North Africa
  Egypt: "20",
  Morocco: "212",
  Algeria: "213",
  Tunisia: "216",
  Libya: "218",
  Sudan: "249",
} as const satisfies Record<string, string>;

/**
 * Map of global country names to their calling code prefixes.
 */
export const GLOBAL_PHONE_CODE_MAP = {
  "United States / Canada": "1",
  India: "91",
  Brazil: "55",
  Mexico: "52",
  Colombia: "57",
  Indonesia: "62",
  Philippines: "63",
  "United Kingdom": "44",
  China: "86",
  "South Korea": "82",
} as const satisfies Record<string, string>;

export const AFRICAN_PHONE_CODES = Object.keys(AFRICAN_PHONE_CODE_MAP);
export const GLOBAL_PHONE_CODES = Object.keys(GLOBAL_PHONE_CODE_MAP);

// Combined map of all supported phone calling codes to country names.
export const ALL_COUNTRY_PHONE_CODES: string[] = [
  ...AFRICAN_PHONE_CODES,
  ...GLOBAL_PHONE_CODES,
];

export const ALLOWED_SMS_COUNTRIES = [AFRICAN_PHONE_CODE_MAP.Nigeria];
