import { ILocation } from "@repo/database";
import { OtpMessageChannel, OtpIdentifierType } from "../types/general";

/**
 * Calculates a dynamic threshold based on post popularity.
 * Formula: Base + Log10(Views) * Multiplier
 * This ensures the threshold grows slower than the view count.
 */
export const calculateThreshold = (viewCount: number = 0): number => {
  const BASE_THRESHOLD = 5;
  const MULTIPLIER = 6;
  const MAX_CEILING = 50; // No post should require more than 50 unique reports

  if (viewCount < 100) return BASE_THRESHOLD;

  // Math.log10(100) = 2 -> (2 * 6) + 5 = 17
  // Math.log10(100,000) = 5 -> (5 * 6) + 5 = 35
  const dynamicValue =
    BASE_THRESHOLD + Math.floor(Math.log10(viewCount) * MULTIPLIER);

  return Math.min(dynamicValue, MAX_CEILING);
};

/**
 * Calculates internal score based on followers and engagement velocity
 */
export const calculateMeritScore = (
  followerCount: number,
  accountAgeInDays: number,
): number => {
  // Logic: Merit score = (Followers / Days Active)
  // We use Math.max to avoid division by zero
  const velocity = followerCount / (accountAgeInDays || 1);
  return velocity;
};

/**
 * Resolves destination type from the raw identifier string.
 */
export const getOtpIdentifierType = (
  value: string,
): OtpIdentifierType | null => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^\+?[\d\s-]{10,}$/;
  if (EMAIL_REGEX.test(value)) return "EMAIL";
  if (PHONE_REGEX.test(value)) return "PHONE_NUMBER";
  return null;
};

/**
 * Calculates Great Circle distance between two [longitude, latitude] coordinates in kilometers.
 */
const calculateDistanceKm = (
  coords1: [number, number],
  coords2: [number, number],
): number => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Computes location relevance score based on coordinate distance with a fallback to city match.
 */
export const calculateLocationScore = (
  userLoc?: ILocation | null,
  postLoc?: ILocation | null,
): number => {
  if (!userLoc || !postLoc) return 0;

  const userCoords = userLoc.coordinates;
  const postCoords = postLoc.coordinates;

  // Primary: Spatial proximity calculation
  if (
    Array.isArray(userCoords) &&
    userCoords.length === 2 &&
    Array.isArray(postCoords) &&
    postCoords.length === 2 &&
    (userCoords[0] !== 0 || userCoords[1] !== 0) &&
    (postCoords[0] !== 0 || postCoords[1] !== 0)
  ) {
    const distanceKm = calculateDistanceKm(userCoords, postCoords);

    if (distanceKm <= 15) return 8; // Very close (same local area)
    if (distanceKm <= 50) return 5; // Close (same metro area)
    if (distanceKm <= 150) return 2; // Regional proximity
    return 0;
  }

  // Fallback: Structural string comparison if coordinates are unpopulated
  if (
    userLoc.city &&
    postLoc.city &&
    userLoc.city.toLowerCase() === postLoc.city.toLowerCase()
  ) {
    return 5;
  }

  if (
    userLoc.country &&
    postLoc.country &&
    userLoc.country.toLowerCase() === postLoc.country.toLowerCase()
  ) {
    return 2;
  }

  return 0;
};

/**
 * Converts a formatted offset string into total minutes.
 * @param offsetStr - Formatted offset string (e.g. "GMT+1", "GMT-05:00").
 * @returns Integer total offset minutes or null if unparseable.
 */
export const parseOffsetToMinutes = (offsetStr?: string): number | null => {
  if (!offsetStr) return null;
  if (offsetStr === "GMT" || offsetStr === "UTC") return 0;

  const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
};
