"use client";

import { IdentifierType } from "@repo/core";
import { getCookie, setCookie } from "./storage";

// Delay function
export const delay = (ms: number = 1500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const zIndexes = {
  negative: -1,
  minimum: 0,
  5: 5,
  10: 10,
  15: 15,
  20: 20,
  25: 25,
  30: 30,
  35: 35,
  40: 40,
  45: 45,
  50: 50,
  55: 55,
  60: 60,
  500: 500,
  maximum: 1000,
};

export const vibrate = (ms: number = 100) => {
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  if (isTouchDevice && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
};

/** * Ensures a persistent device identifier exists on the client.
 */
export const getOrCreateDeviceId = (): string => {
  let deviceId = getCookie("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();

    const isProd = window.location.hostname.includes("funstakes.net");

    setCookie("device_id", deviceId, 525600, {
      // Only set domain in production to allow localhost to work fine
      domain: isProd ? ".funstakes.net" : undefined,
      // Only force secure/none in production or if using local HTTPS
      secure: isProd || window.location.protocol === "https:",
      sameSite: isProd ? "none" : "lax",
      path: "/",
    });
  }

  return deviceId;
};

/**
 * Resolves destination type from the raw identifier string.
 */
export const getOtpIdentifierType = (value?: string): IdentifierType | null => {
  if (!value) return null;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^\+?[\d\s-]{10,}$/;
  if (EMAIL_REGEX.test(value)) return "EMAIL";
  if (PHONE_REGEX.test(value)) return "PHONE_NUMBER";
  return null;
};

/**
 * Determines if the client device has enough hardware resources for local WebAssembly compression.
 */
export const checkDeviceCapability = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  return cores >= 4 && deviceMemory >= 4;
};
