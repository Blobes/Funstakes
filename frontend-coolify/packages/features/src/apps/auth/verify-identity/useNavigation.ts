"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  purgeCacheKeys,
  queryClient,
  setCookie,
  getCookie,
  deleteCookie,
} from "@repo/helpers";
import {
  CLIENT_ROUTES,
  IUser,
  OtpTransitData,
  OtpMessageChannel,
  OtpReason,
  TransitPurpose,
  IdentifierType,
  VerifyIdentityMethod,
  STORAGE_KEYS,
  useGlobalStore,
  IPage,
  SNACKBAR_DURATION,
} from "@repo/core";
import { useCachedData, usePage, useSnackbar } from "@repo/shared-hooks";
import { VerifyIdentityService } from "./services";

type TransitKeyType = readonly string[] | readonly (readonly string[])[];

export interface OtpNavigation {
  user?: IUser | null;
  identifier?: string;
  identifierType?: IdentifierType;
  reason: OtpReason;
  purpose?: TransitPurpose;
  transitKey?: TransitKeyType;
  otpMessageChannel?: OtpMessageChannel;
  verificationMethod?: VerifyIdentityMethod;
  dispatchOnload?: boolean;
  sessionDurationMins?: number;
}

export interface ClearSession {
  transitKey?: TransitKeyType;
  returnPage?: IPage;
}

const DEFAULT_SESSION_DURATION_MINUTES = 15;
const DEFAULT_SESSION_DURATION_SECONDS = DEFAULT_SESSION_DURATION_MINUTES * 60;

/**
 * Computes remaining session time in seconds from stored cookie timestamp.
 */
const getRemainingSessionTime = (): number => {
  const tempSession = getCookie(STORAGE_KEYS.TEMPORARY_SESSION_KEY);
  if (!tempSession) return DEFAULT_SESSION_DURATION_SECONDS;

  const expiryMs = parseInt(tempSession, 10);
  if (isNaN(expiryMs)) return DEFAULT_SESSION_DURATION_SECONDS;

  return Math.max(0, Math.round((expiryMs - Date.now()) / 1000));
};

/**
 * Retrieves the active transit key stored in the cookies.
 */
const getStoredTransitKey = (): TransitKeyType | undefined => {
  const stored = getCookie(STORAGE_KEYS.SESSION_TRANSIT_KEY);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored) as TransitKeyType;
  } catch {
    return undefined;
  }
};

export const useVerificationNavigation = () => {
  const { navigateTo } = usePage();
  const { resetMsgCode } = VerifyIdentityService();
  const { setSBMessage } = useSnackbar();
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const [timeLeft, setTimeLeft] = useState<number>(getRemainingSessionTime);
  const [isTerminatingSession, setIsTerminatingSession] = useState(false);

  // Ref initialized from cookie to ensure continuity across page reloads and remounts.
  const activeTransitKeyRef = useRef<TransitKeyType | undefined>(
    getStoredTransitKey(),
  );

  let cachedTransit: OtpTransitData<TransitPurpose> | undefined;
  if (activeTransitKeyRef.current) {
    cachedTransit = useCachedData<OtpTransitData<TransitPurpose>>(
      activeTransitKeyRef.current,
    )[0];
  }

  /**
   * Clears active temporary cookies, purges cache transit keys, resets auth status, and resets OTP state.
   */
  const clearTemporarySession = useCallback(
    async (options: ClearSession = {}) => {
      const activeKey = options.transitKey || activeTransitKeyRef.current;
      const recipient = cachedTransit?.identifier;

      if (recipient) {
        setIsTerminatingSession(true);
        console.log("hello");
        try {
          const resetRes = await resetMsgCode(recipient);
          const msg = resetRes.localizedSuccessMsg;
          if (msg) {
            setSBMessage({
              msg: {
                tagline: msg,
                msgStatus: "SUCCESS",
                duration: SNACKBAR_DURATION.SECS_6,
              },
            });
          }
        } catch (error) {
          console.error(
            "[clearTemporarySession] Failed to reset OTP code:",
            error,
          );
        } finally {
          setIsTerminatingSession(false);
        }
      }

      setAuthStatus("UNAUTHENTICATED");

      if (activeKey) {
        purgeCacheKeys({
          queryClient,
          queryKeys: activeKey,
        });
      }

      deleteCookie(STORAGE_KEYS.TEMPORARY_SESSION_KEY);
      deleteCookie(STORAGE_KEYS.SESSION_TRANSIT_KEY);

      if (options.returnPage) navigateTo(options.returnPage);
    },
    [
      setAuthStatus,
      resetMsgCode,
      setSBMessage,
      setIsTerminatingSession,
      navigateTo,
    ],
  );
  // Tracks temporary session countdown timer based on expiry cookie.
  useEffect(() => {
    const tempSession = getCookie(STORAGE_KEYS.TEMPORARY_SESSION_KEY);
    if (!tempSession) return;

    const storedTransitKey = getStoredTransitKey();
    if (storedTransitKey) {
      activeTransitKeyRef.current = storedTransitKey;
    }

    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((parseInt(tempSession, 10) - Date.now()) / 1000),
      );
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        clearTemporarySession({ transitKey: activeTransitKeyRef.current });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clearTemporarySession]);

  /**
   * Evaluates if TOTP authenticator mode is available for current user context.
   */
  const checkTotpConfiguration = useCallback(
    (user: IUser | null) =>
      Boolean(user?.hasEnabledMFA) && Boolean(user?.totpAuth?.secret),
    [],
  );

  /**
   * Prepares and routes user to the OTP verification flow.
   */
  const handleVerificationNavigation = useCallback(
    (navOptions: OtpNavigation) => {
      const {
        user,
        identifier,
        identifierType,
        reason,
        purpose = "LOGIN_VERIFICATION",
        transitKey = STORAGE_KEYS.AUTH_TRANSIT,
        otpMessageChannel,
        verificationMethod,
        dispatchOnload,
        sessionDurationMins = DEFAULT_SESSION_DURATION_MINUTES,
      } = navOptions;

      if (!user) return;

      const activeChannel: OtpMessageChannel =
        otpMessageChannel ??
        (identifierType === "EMAIL" ? "EMAIL" : "WHATSAPP");

      const hasTotp = checkTotpConfiguration(user);

      const otpTransitData: OtpTransitData<typeof purpose> = {
        transitId: transitKey.join("_"),
        identifier,
        otpMessageChannel: activeChannel,
        purpose,
        payload: user,
        reason,
        verificationMethod:
          verificationMethod ?? (hasTotp ? "TOTP" : "MESSAGING"),
        dispatchOnload,
      };

      activeTransitKeyRef.current = transitKey;
      queryClient.setQueryData(transitKey, otpTransitData);

      const expiryTimestamp = Date.now() + sessionDurationMins * 60 * 1000;

      setCookie(
        STORAGE_KEYS.TEMPORARY_SESSION_KEY,
        expiryTimestamp.toString(),
        sessionDurationMins,
      );
      setCookie(
        STORAGE_KEYS.SESSION_TRANSIT_KEY,
        JSON.stringify(transitKey),
        sessionDurationMins,
      );

      setTimeLeft(sessionDurationMins * 60);

      navigateTo(CLIENT_ROUTES.verifyIdentity, { loadPage: true });
    },
    [navigateTo, checkTotpConfiguration],
  );

  return {
    handleVerificationNavigation,
    checkTotpConfiguration,
    clearTemporarySession,
    timeLeft,
    storedTransitKey: activeTransitKeyRef.current,
    isTerminatingSession,
  };
};
