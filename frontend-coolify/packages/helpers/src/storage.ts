"use client";

import { del, get, set } from "idb-keyval";
import { IIdbData, STORAGE_KEYS } from "@repo/core";
import { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Safe wrapper for indexedDB operations to prevent SSR crashes.
 */
export const idbStorage = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") return null;
    return await get(key);
  },
  setItem: async (key: string, value: any) => {
    if (typeof window === "undefined") return;
    await set(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === "undefined") return;
    await del(key);
  },
};

/**
 * Saves raw binary handles or structured payloads encapsulated inside the structural metadata interface contract.
 */
export const saveDataToIdb = async <T = File[]>(
  key: string,
  data: T,
): Promise<void> => {
  if (!data) return;
  if (Array.isArray(data) && !data.length) return;

  const payload: IIdbData<T> = {
    data,
    savedAt: new Date(),
    lastViewed: null,
  };

  await idbStorage.setItem(key, payload);
};

/**
 * Recovers the structural wrapper from storage, automatically appending reactive timestamp states.
 */
export const getDataFromIdb = async <T = File[]>(
  key: string,
): Promise<IIdbData<T> | null> => {
  const cachedRecord = await idbStorage.getItem(key);
  if (!cachedRecord) return null;

  const parsedRecord = cachedRecord as IIdbData<T>;

  // Track access tracking history automatically on ingestion
  parsedRecord.lastViewed = new Date();
  await idbStorage.setItem(key, parsedRecord);

  return parsedRecord;
};

/**
 * Purges specified structural asset tracking blocks completely from database records.
 */
export const purgeDataFromIdb = async (key: string): Promise<void> => {
  await idbStorage.removeItem(key);
};

/**
 * Sets a cookie with legacy minute support and an optional configuration object.
 */
export const setCookie = (
  name: string,
  value: string,
  minutes: number,
  options: {
    domain?: string;
    secure?: boolean;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
  } = {},
) => {
  const expires = new Date(Date.now() + minutes * 60000).toUTCString();

  // Use the provided path or default to /
  const cookiePath = options.path || "/";
  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${cookiePath}`;

  if (options.domain) cookieString += `; domain=${options.domain}`;
  if (options.secure) cookieString += `; secure`;
  if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return match ? decodeURIComponent(match[2]) : null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; path=/`;
};

/**
 * Removes multiple cookies from storage by key array.
 */
export const clearCookies = (keys: string[]): void => {
  keys.forEach((key) => deleteCookie(key));
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    const valueToStore = JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
  } catch (error) {
    console.error("Storage Error:", error);
  }
};

interface LocalItem {
  key?: string;
  fallback?: any;
}
export const getFromLocalStorage = <T = unknown | any>({
  key = STORAGE_KEYS.SAVED_PAGE,
  fallback,
}: LocalItem = {}): T | null => {
  if (typeof window === "undefined") return (fallback as T) ?? null;

  const savedItem = localStorage.getItem(key);
  if (savedItem) {
    try {
      return JSON.parse(savedItem) as T;
    } catch (e) {
      return savedItem as unknown as T;
    }
  }
  return (fallback as T) ?? null;
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting from localStorage (key: "${key}"):`, error);
  }
};

export const clearLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

interface CacheEntityInput<T extends { _id: string }> {
  queryClient: QueryClient;
  entityId: string;
  granularKeys: QueryKey[];
  listKeys: QueryKey[];
  extractList: (data: unknown) => T[] | undefined;
}

export function getEntityFromCache<T extends { _id: string }>(
  input: CacheEntityInput<T>,
): T | undefined {
  const { queryClient, entityId, granularKeys, listKeys, extractList } = input;
  for (const key of granularKeys) {
    const direct = queryClient.getQueryData<T>(key);
    if (direct) return direct;
  }
  for (const key of listKeys) {
    const listData = queryClient.getQueryData(key);
    const list = extractList(listData);
    const match = list?.find((item) => item._id === entityId);
    if (match) return match;
  }
  return undefined;
}
