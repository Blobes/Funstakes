import { Request } from "express";
import { ILocation } from "@repo/database";
import {
  CONTINENT_NAME_MAP,
  DATACENTER_ISP_PATTERNS,
  HTTP_REQ_HEADERS,
} from "../constants/others";
import { parseOffsetToMinutes } from "./calculations";

export interface IGeoLocationResult extends ILocation {
  isp: string | null;
  latitude: number | null;
  longitude: number | null;
  flag: null;
}

/**
 * Checks if a given ISP string originates from a hosting or VPN datacenter.
 *
 * @param isp - The ISP name string returned from IP lookups.
 * @returns Boolean indicating high probability of VPN/proxy usage.
 */
export const isDatacenterIsp = (isp: string | null): boolean => {
  if (!isp) return false;
  const normalized = isp.toLowerCase();
  return DATACENTER_ISP_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
};

/**
 * Validates if the client's reported timezone offset mismatches the IP location offset.
 *
 * @param req - Incoming Express HTTP request.
 * @param resolvedCountry - Resolved ISO country code (e.g., "NG", "US", "DE").
 * @returns Boolean indicating potential VPN location spoofing.
 */
export const hasTimezoneMismatch = (
  req: Request,
  resolvedCountry?: string | null,
): boolean => {
  const clientTimezone = req.headers[
    HTTP_REQ_HEADERS.CLIENT_TIMEZONE
  ] as string;
  if (!clientTimezone || !resolvedCountry) return false;

  try {
    const now = new Date();

    // Derive client offset in minutes from incoming IANA string
    const clientFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: clientTimezone.trim(),
      timeZoneName: "shortOffset",
    });

    // Extract offset string e.g., "GMT+1" or "GMT-5"
    const clientOffsetStr = clientFormatter
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value;

    const clientMinutes = parseOffsetToMinutes(clientOffsetStr);
    if (clientMinutes === null) return true;

    // Retrieve system time offset or gateway header timezone
    const headerTimezone = req.headers[HTTP_REQ_HEADERS.TIMEZONE] as string;
    if (!headerTimezone) return false;

    const ipFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: headerTimezone.trim(),
      timeZoneName: "shortOffset",
    });

    const ipOffsetStr = ipFormatter
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value;

    const ipMinutes = parseOffsetToMinutes(ipOffsetStr);
    if (ipMinutes === null) return false;

    // Flag as mismatch if offset difference exceeds 60 minutes
    return Math.abs(clientMinutes - ipMinutes) > 60;
  } catch {
    // Flag invalid or malformed IANA timezones as suspicious
    return true;
  }
};

/**
 * Extract location metadata injected by proxy/gateway headers.
 * @param req - Incoming Express HTTP request.
 * @returns Geo location attributes object or null if headers are absent.
 */
export const getLocationFromHeader = (
  req: Request,
): IGeoLocationResult | null => {
  const country = req.headers[HTTP_REQ_HEADERS.COUNTRY] as string;

  // Header missing or set to unknown/TOR internal code
  if (!country || country === "XX" || country === "T1") {
    return null;
  }
  const city = (req.headers[HTTP_REQ_HEADERS.CITY] as string) || null;
  const state = (req.headers[HTTP_REQ_HEADERS.REGION] as string) || null;
  const region = (req.headers[HTTP_REQ_HEADERS.REGION_CODE] as string) || null;
  const continentCode =
    (req.headers[HTTP_REQ_HEADERS.CONTINENT] as string) || null;
  const latitudeStr = req.headers[HTTP_REQ_HEADERS.LATITUDE] as string;
  const longitudeStr = req.headers[HTTP_REQ_HEADERS.LONGITUDE] as string;

  const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
  const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

  const continentName = continentCode
    ? CONTINENT_NAME_MAP[
        continentCode.toUpperCase() as keyof typeof CONTINENT_NAME_MAP
      ]
    : null;

  return {
    continent: continentName,
    continentCode,
    country,
    region,
    state,
    city,
    isp: null,
    latitude,
    longitude,
    flag: null,
  };
};

/**
 * Fetch fallback location data using ip-api.com for local testing.
 *
 * @param ip - Client IP address to geolocate.
 * @returns Geo location attributes object or null.
 */
export async function getLocationFromIp(
  ip: string | undefined,
): Promise<IGeoLocationResult | null> {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    return null;
  }

  try {
    const fields =
      "status,message,continent,continentCode,country,region,regionName,city,isp,lat,lon";
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=${fields}`,
    );

    if (!response.ok) {
      console.error(`Geo API HTTP Error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;

    if (data.status !== "success") {
      console.warn("IP lookup logic failure:", data.message);
      return null;
    }

    return {
      continent: data.continent,
      continentCode: data.continentCode,
      country: data.country,
      region: data.region,
      state: data.regionName,
      city: data.city,
      isp: data.isp,
      latitude: data.lat,
      longitude: data.lon,
      flag: null,
      isVpnOrProxy: isDatacenterIsp(data.isp),
    };
  } catch (err: any) {
    console.error("Geo Network Error:", err.message);
    return null;
  }
}

/**
 * Extract real client IP address from proxy headers prioritizing direct gateway headers.
 *
 * @param req - Incoming Express HTTP request.
 * @returns Client IP address string.
 */
export const getClientIp = (req: Request): string => {
  const connectingIp = req.headers[HTTP_REQ_HEADERS.CONNECTING_IP];
  const xff = req.headers[HTTP_REQ_HEADERS.XFF];
  const xRealIp = req.headers[HTTP_REQ_HEADERS.X_REAL_IP];

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const ip =
    first(connectingIp)?.trim() ||
    first(xff)?.split(",")[0]?.trim() ||
    first(xRealIp)?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown_client";

  return ip;
};

/**
 * Resolve client location into standard GeoJSON Point structure with VPN detection.
 * Prioritizes proxy headers, with ip-api.com as fallback.
 *
 * @param req - Incoming Express HTTP request.
 * @param ipAddress - Target client IP address fallback.
 * @returns Formatted GeoJSON point location object or undefined.
 */
export const buildLocationFromRequest = async (
  req: Request,
  ipAddress?: string,
): Promise<ILocation | undefined> => {
  const headerLocation = getLocationFromHeader(req);

  if (
    headerLocation &&
    headerLocation.latitude !== null &&
    headerLocation.longitude !== null
  ) {
    const cityName = headerLocation.city || "Unknown City";
    const stateName = headerLocation.state || "Unknown State";
    const isVpnDetected = hasTimezoneMismatch(req, headerLocation.country);

    return {
      name: `${cityName}, ${stateName}, ${headerLocation.country}`,
      city: cityName,
      state: stateName,
      country: headerLocation.country,
      region: headerLocation.region || "",
      continent: headerLocation.continent || "",
      continentCode: headerLocation.continentCode,
      type: "Point" as const,
      coordinates: [headerLocation.longitude, headerLocation.latitude],
      isVpnOrProxy: isVpnDetected,
    };
  }

  const isDev = process.env.NODE_ENV === "development";

  const targetIp =
    ipAddress ||
    (getClientIp(req) !== "unknown_client" ? getClientIp(req) : undefined) ||
    (isDev ? generateRandomIp() : "unknown_client");

  const geoData = await getLocationFromIp(targetIp);
  if (!geoData) return undefined;

  const isVpnDetected =
    geoData.isVpnOrProxy || hasTimezoneMismatch(req, geoData.country);

  return {
    name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
    city: geoData.city,
    state: geoData.state,
    country: geoData.country,
    region: geoData.region || "",
    continent: geoData.continent || "",
    continentCode: geoData.continentCode,
    type: "Point" as const,
    coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
    isVpnOrProxy: isVpnDetected,
  };
};

/**
 * Generates a random IPv4 address string for development fallback testing.
 *
 * @returns IPv4 address string.
 */
export const generateRandomIp = () => {
  const rand = () => Math.floor(Math.random() * 256);
  return `${rand()}.${rand()}.${rand()}.${rand()}`;
};

/**
 * Appends random digits to an email username for testing purposes.
 *
 * @param email - Target base email string.
 * @returns Obfuscated unique test email string.
 */
export const generateTestEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${username}${randomNumber}@${domain}`;
};
