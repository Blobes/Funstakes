"use client";

export const getInitialsAndColors = (
  value: string = "#",
): { initials: string; textColor: string; bgColor: string } => {
  const parts = value.trim().split(/\s+/);
  const initials =
    (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();

  // Consistent hash function
  const hashCode = (str: string): number =>
    str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hash = hashCode(initials || value);

  // 1. Generate consistent Background Color
  // We use a simpler bitwise shift to ensure we get valid 6-digit hex
  const c = (hash * 137.508) % 1; // Golden angle approximation for variety
  const bgColor = `#${Math.floor(Math.abs(Math.sin(hash) * 16777215))
    .toString(16)
    .padStart(6, "0")}`;

  // 2. Calculate Contrast (YIQ Formula)
  const getContrastColor = (hexcolor: string): string => {
    // Remove # if present
    const hex = hexcolor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // YIQ equation determines perceived brightness
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // If yiq is > 128, the color is "bright", so use black text.
    // Otherwise, use white text.
    return yiq >= 128 ? "#1A1A1A" : "#FFFFFF";
  };

  const textColor = getContrastColor(bgColor);

  return { initials, textColor, bgColor };
};

/**
 * Returns a deterministic image URL from an array based on initials or text hash matches.
 */
export const getImageFromText = (
  text: string = "#",
  images: string[],
): { imageUrl: string } => {
  if (!images || images.length === 0) {
    return { imageUrl: "" };
  }
  const parts = text.trim().split(/\s+/);
  const initials =
    (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();

  const hashCode = (str: string): number =>
    str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hash = hashCode(initials || text);

  // Determine an array element pointer using the resulting hash integer value safely
  const imageIndex = Math.abs(hash) % images.length;
  const imageUrl = images[imageIndex] || "";

  return { imageUrl };
};

/**
 * Extracts specified dynamic keys from a payload object.
 */
export const extractPayloadKeys = <T extends object, K extends PropertyKey>(
  payload: T | undefined | null,
  keys: K[],
): Partial<Record<K, unknown>> => {
  if (!payload || typeof payload !== "object") return {};

  return keys.reduce<Partial<Record<K, unknown>>>((acc, key) => {
    if (key in payload) {
      acc[key] = (payload as Record<PropertyKey, unknown>)[key];
    }
    return acc;
  }, {});
};
