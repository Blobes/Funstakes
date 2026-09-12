"use client";

import {
  ApiError,
  APITransMsg,
  COMMON_FEEDBACK,
  FetchStatus,
  useGlobalStore,
} from "@repo/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT = 60000; // Default timeout in milliseconds (1 minute)

/**
 * Parses and translates structured feedback contracts sent directly from API nodes.
 */
export const translateAPIMessage = (
  payload: APITransMsg,
  fallbackKey: string = COMMON_FEEDBACK.server_error_tagline.tKey,
): string => {
  const storeState = useGlobalStore.getState();
  const I18nInstance = storeState.i18nInstance;
  const currentLanguage = storeState.currentLanguage;

  if (!I18nInstance) return payload?.message || "";

  if (!payload?.i18nKey)
    return (
      payload?.message || I18nInstance.t(fallbackKey, { lng: currentLanguage })
    );

  // Route lookups to the isolated apimessage namespace file explicitly
  const translationKey = payload.i18nKey.includes(":")
    ? payload.i18nKey
    : `apimessage:${payload.i18nKey}`;

  return I18nInstance.t(translationKey, {
    defaultValue: payload.message,
    ...payload.interpolations,
    lng: currentLanguage,
  });
};

/**
 * Standardized fetch wrapper that handles timeouts, base URLs, and error parsing.
 */
export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<T> => {
  const controller = new AbortController();
  const signal = options.signal || controller.signal;
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);

  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: options.method || "GET",
      headers,
      signal,
      credentials: "include",
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    // Parse response body once
    let responseData: any = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    }

    // Extract message fields safely from root or nested error payloads
    let localizedString = "";
    if (responseData) {
      const target = responseData.error || responseData;
      const i18nKey = target.i18nKey;
      const interpolations = target.interpolations;
      const rawMessage =
        target.message || target.errMsg || responseData.message;

      if (i18nKey || rawMessage) {
        const fallbackKey = response.ok
          ? COMMON_FEEDBACK.server_request_successful.tKey
          : COMMON_FEEDBACK.server_error_tagline.tKey;

        localizedString = translateAPIMessage(
          { i18nKey, interpolations, message: rawMessage },
          fallbackKey,
        );

        responseData.localizedSuccessMsg = localizedString;
        if (responseData.error) {
          responseData.error.localizedErrMsg = localizedString;
        }
      }
    }

    // --- ERROR HANDLING ROUTINE ---
    if (!response.ok) {
      // Retain the raw, un-translated server error message for dev console logs
      const rawServerMessage =
        responseData?.error?.message ||
        responseData?.message ||
        responseData?.error?.errMsg ||
        response.statusText ||
        "Request failed";

      const error = new Error(rawServerMessage) as ApiError;
      error.httpStatus = response.status;
      error.status = responseData?.status || "ERROR";
      error.payload = responseData || null;

      // Preserve structured retryAfter from root or error property
      error.retryAfter =
        responseData?.retryAfter ?? responseData?.error?.retryAfter ?? null;

      // Attach translated string exclusively to localizedErrMsg for UI consumers
      error.localizedErrMsg =
        localizedString ||
        responseData?.error?.localizedErrMsg ||
        translateAPIMessage(
          {
            i18nKey: responseData?.i18nKey || responseData?.error?.i18nKey,
            message: rawServerMessage,
          },
          COMMON_FEEDBACK.server_error_tagline.tKey,
        );

      throw error;
    }

    // Return merged data for successful requests
    return {
      ...responseData,
      httpStatus: response.status,
    } as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.httpStatus !== undefined) throw error;

    // Retain original raw error message for console logging
    const apiErr = new Error(error.message) as ApiError;

    // Map network or timeout failures to a status 0 for checkNetworkError logic
    if (error.name === "AbortError" || error.message === "timeout") {
      apiErr.localizedErrMsg = translateAPIMessage({
        i18nKey: COMMON_FEEDBACK.network_connection_failed.tKey,
        message: COMMON_FEEDBACK.network_connection_failed.tValue,
      });
      apiErr.httpStatus = 0;
      apiErr.status = "TIMEOUT";
      apiErr.payload = null;
    } else if (
      error.message === "Failed to fetch" ||
      error instanceof TypeError
    ) {
      apiErr.localizedErrMsg = translateAPIMessage({
        i18nKey: COMMON_FEEDBACK.server_error_tagline.tKey,
        message: COMMON_FEEDBACK.server_error_tagline.tValue,
      });
      apiErr.httpStatus = 0;
      apiErr.status = "NETWORK_ERROR";
      apiErr.payload = null;
    } else {
      apiErr.localizedErrMsg = translateAPIMessage({
        i18nKey: COMMON_FEEDBACK.unknown_error.tKey,
        message: error.message || COMMON_FEEDBACK.unknown_error.tValue,
      });
      apiErr.httpStatus = 500;
      apiErr.status = "ERROR";
      apiErr.payload = null;
    }
    throw apiErr;
  }
};

/**
 * Helper to identify if a TanStack error is network-related for UI feedback.
 */
export const checkNetworkError = (err: ApiError) => {
  const isNetworkError =
    err.httpStatus === 0 ||
    err.httpStatus >= 500 ||
    err.status === "TIMEOUT" ||
    err.status === "NETWORK_ERROR";

  if (isNetworkError) {
    return {
      payload: null,
      status: "ERROR" as FetchStatus,
      message: translateAPIMessage({
        i18nKey: COMMON_FEEDBACK.network_connection_failed.tKey,
        message: COMMON_FEEDBACK.network_connection_failed.tValue,
      }),
    };
  }
  return null;
};
