import { Request } from "express";
import { ILocation } from "@repo/database";

/**
 * Fetches location data using ip-api.com.
 *
 * @param ip Client IP address to geolocate.
 * @returns Parsed geographic data object or null on failure/local IP.
 */
export async function getLocationFromIp(ip: string | undefined) {
  // Guard against local/internal IPs
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    return null;
  }

  try {
    // Added continent and continentCode to requested API fields
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
      regionCode: data.region,
      state: data.regionName,
      city: data.city,
      isp: data.isp,
      latitude: data.lat,
      longitude: data.lon,
      flag: null,
    };
  } catch (err: any) {
    console.error("Geo Network Error:", err.message);
    return null;
  }
}

/**
 * Resolves IP address into standard GeoJSON Point location structure.
 *
 * @param ipAddress Target client IP address.
 * @returns Formatted GeoJSON point location object or undefined.
 */
export const buildLocationFromIp = async (
  ipAddress: string,
): Promise<ILocation | undefined> => {
  const geoData = await getLocationFromIp(ipAddress);
  if (!geoData) return undefined;

  return {
    name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
    city: geoData.city,
    state: geoData.state,
    country: geoData.country,
    region: geoData.regionCode,
    continent: geoData.continent,
    type: "Point" as const,
    coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
  };
};

/**
 * Extracts real client IP address from proxy headers prioritizing Cloudflare headers.
 */
export const getClientIp = (req: Request): string | undefined => {
  const cfIp = req.headers["cf-connecting-ip"];
  const xff = req.headers["x-forwarded-for"];
  const xRealIp = req.headers["x-real-ip"];

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const ip =
    first(cfIp)?.trim() ||
    first(xff)?.split(",")[0]?.trim() ||
    first(xRealIp)?.trim() ||
    req.ip ||
    req.socket.remoteAddress;

  return ip;
};

export const generateRandomIp = () => {
  const rand = () => Math.floor(Math.random() * 256); // 0–255
  return `${rand()}.${rand()}.${rand()}.${rand()}`;
};

export const generateTestEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit
  return `${username}${randomNumber}@${domain}`;
};
