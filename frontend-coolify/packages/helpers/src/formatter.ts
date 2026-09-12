"use client";

/**
 * Capitalizes the first character of a string and converts the remaining characters to lowercase.
 */
export const capitalize = (string: string): string => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

/**
 * Formats a phone string into standard display format with visual spacing and brackets.
 */
export const formatPhoneNumber = (
  value: string,
  removePlus = false,
): string => {
  if (!value) return value;

  const containsPlus = value.includes("+") && !removePlus;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return containsPlus ? "+" : "";

  if (containsPlus) {
    // 1. Determine Code Length by finding the closing bracket
    const bracketIndex = value.indexOf(")");
    let codeLength = 3; // Default fallback

    if (bracketIndex !== -1) {
      // Get everything before the bracket and count the digits
      const codePart = value.slice(0, bracketIndex).replace(/\D/g, "");
      codeLength = codePart.length;
    } else {
      /**
       * Fallback: If the user typed '+23480...' without brackets,
       * we assume a 3-digit code or take the first 3 digits.
       */
      codeLength = digits.length > 10 ? 3 : digits.length > 7 ? 1 : 3;
    }

    const code = digits.slice(0, codeLength);
    const rest = digits.slice(codeLength);

    // 2. Format with the identified code
    if (rest.length === 0) return `(+${code}) `;
    if (rest.length <= 3) return `(+${code}) ${rest}`;
    if (rest.length <= 6)
      return `(+${code}) ${rest.slice(0, 3)} ${rest.slice(3)}`;
    if (rest.length <= 10)
      return `(+${code}) ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;

    // For very long international numbers
    return `(+${code}) ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)} ${rest.slice(10)}`;
  }

  // CASE B: Local Format (Standard 10-11 digit local number)
  const len = digits.length;
  if (len < 4) return digits;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 11)}`;
};

/**
 * Combines a selected country code with a local subscriber number.
 * Ensures the "Trunk Prefix" (leading 0) is removed if present.
 * * @param localNumber - The raw string from the input field (e.g., "0805 764")
 * @param selectedCode - The code from input field dropdowns (e.g., "+234")
 * @returns A clean E.164 formatted string (e.g., "+2348057648520")
 */
export const sanitizePhoneNumber = (
  localNumber: string,
  selectedCode: string = "+234",
): string => {
  // 1. Extract only the digits from the local input
  let digits = localNumber.replace(/\D/g, "");

  if (!digits) return "";

  // 2. Remove the leading '0' if the user typed one (e.g., 0805 -> 805)
  // Most countries drop the 0 when an international code is prepended.
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 3. Ensure the selectedCode has a '+' and combine
  const prefix = selectedCode.startsWith("+")
    ? selectedCode
    : `+${selectedCode}`;

  return `${prefix}${digits}`;
};

interface FormatPhoneResult {
  nextVal: string;
  nextCursor: number;
  shouldReset: boolean;
  shouldOpenMenu: boolean;
}
/**
 * Transforms raw inputs into formatted phone values and manages cursor shifts for hardware or software entries.
 */
export const processPhoneFormatting = (
  rawValue: string,
  currentCursor: number,
  isDeleting: boolean,
  includeCountryCode: boolean,
  isCountrySelected: boolean,
): FormatPhoneResult => {
  let nextVal = rawValue;
  let nextCursor = currentCursor;

  if (includeCountryCode && isDeleting && nextVal.length <= 6) {
    return {
      nextVal: "",
      nextCursor: 0,
      shouldReset: true,
      shouldOpenMenu: false,
    };
  }

  const shouldOpenMenu = !!(
    includeCountryCode &&
    !isDeleting &&
    nextVal.length > 0 &&
    !isCountrySelected
  );

  const oldLen = nextVal.length;
  nextVal = formatPhoneNumber(nextVal);
  const newLen = nextVal.length;

  if (!isDeleting) {
    nextCursor = nextCursor + (newLen - oldLen);
  }

  return {
    nextVal,
    nextCursor,
    shouldReset: false,
    shouldOpenMenu,
  };
};

/**
 * Extracts a matching country code from a phone string based on an allowed code list.
 */
export const extractCountryCode = (
  phone?: string,
  allowedCodes: string[] = [],
): string | null => {
  if (!phone) return null;

  // Clean all non-digit characters except a leading '+'
  const cleaned = phone.replace(/[^\d+]/g, "");
  const digitsOnly = phone.replace(/\D/g, "");

  // Match against strings with or without a '+' prefix
  const matchedCode = allowedCodes.find(
    (code) => cleaned.startsWith(`+${code}`) || digitsOnly.startsWith(code),
  );

  return matchedCode || null;
};
