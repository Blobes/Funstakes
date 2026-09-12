"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useVerificationNavigation } from "@repo/features";
import { getCookie } from "@repo/helpers";
import {
  VerifyIdentityMethod,
  OtpTransitData,
  TransitPurpose,
  useGlobalStore,
  STORAGE_KEYS,
  AUTH_BUTTON_LABELS,
  IUser,
} from "@repo/core";

export interface BaseVerificationProps<
  P extends TransitPurpose = TransitPurpose,
> {
  activeTransit?: OtpTransitData<P>;
  onSuccess?: () => void;
  onSwitchMethod?: (targetMethod: VerifyIdentityMethod) => void;
  availableMethods?: VerifyIdentityMethod[];
  onRateLimitExceeded?: () => void;
  isBotChallengeAllowed?: () => boolean;

  setShouldRestrict?: (value: boolean) => void;
  style?: React.CSSProperties;
}

export interface VerifyIdentityProps<
  P extends TransitPurpose = TransitPurpose,
> {
  transitData?: OtpTransitData<P>[];
  initialMethod?: VerifyIdentityMethod;
  onSuccess?: () => void;
  onRateLimitExceeded?: () => void;
  isBotChallengeAllowed?: () => boolean;
  setShouldRestrict?: (value: boolean) => void;
  customMethods?: VerifyIdentityMethod[];
  containerStyle?: React.CSSProperties;
}

export interface UseVerifyIdentityProps<P extends TransitPurpose> {
  transitData?: OtpTransitData<P>[];
  initialMethod?: VerifyIdentityMethod;
  customMethods?: VerifyIdentityMethod[];
  setShouldRestrict?: (value: boolean) => void;
}

/**
 * Manages verification method selection, active transit session evaluation, and security restrictions.
 */
export const useVerifyIdentity = <P extends TransitPurpose>(
  props: UseVerifyIdentityProps<P> = {},
) => {
  const { transitData, initialMethod, customMethods, setShouldRestrict } =
    props;
  const activeTransit = transitData?.[0];
  const authUser = useGlobalStore((state) => state.authUser);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const {
    checkTotpConfiguration,
    clearTemporarySession,
    timeLeft,
    storedTransitKey,
  } = useVerificationNavigation();

  const userHasTotp = checkTotpConfiguration(authUser);

  const hasUserCtx =
    authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified;

  /**
   * Checks session freshness and immediately purges cache keys when the temporary session cookie expires.
   */
  useEffect(() => {
    const tempSession = getCookie(STORAGE_KEYS.TEMPORARY_SESSION_KEY);
    if (!tempSession) {
      clearTemporarySession({ transitKey: storedTransitKey });
    }
  }, [clearTemporarySession, storedTransitKey]);

  /**
   * Evaluates active transit session validity to update restrict state.
   */
  useEffect(() => {
    const hasValidSession = Boolean(activeTransit || hasUserCtx);
    setShouldRestrict?.(!hasValidSession);
  }, [activeTransit, hasUserCtx, setShouldRestrict]);

  const purpose = activeTransit?.purpose;

  const availableMethods = useMemo<VerifyIdentityMethod[]>(() => {
    if (customMethods && customMethods.length > 0) return customMethods;

    if (purpose === "SIGNUP_VERIFICATION") {
      return ["MESSAGING"];
    }

    const hasSecurityQuestions = Boolean(
      authUser?.securityQuestionsId, // ||
      //  (activeTransit?.payload as IUser)?.securityQuestionsId,
    );

    if (purpose === "MFA_ACTIVATION") {
      const methods: VerifyIdentityMethod[] = ["MESSAGING"];
      if (!userHasTotp) {
        methods.unshift("TOTP");
      }
      // Allow SECURITY_QUESTIONS if not configured yet (for setup)
      if (!hasSecurityQuestions) methods.push("SECURITY_QUESTIONS");
      return methods;
    }

    const methods: VerifyIdentityMethod[] = ["MESSAGING"];
    if (userHasTotp) {
      methods.unshift("TOTP");
    }
    if (hasSecurityQuestions) {
      methods.push("SECURITY_QUESTIONS");
    }
    return methods;
  }, [
    customMethods,
    purpose,
    userHasTotp,
    authUser?.securityQuestionsId,
    activeTransit?.payload,
  ]);

  const defaultMethod = useMemo<VerifyIdentityMethod>(() => {
    if (initialMethod && availableMethods.includes(initialMethod)) {
      return initialMethod;
    }
    if (activeTransit?.verificationMethod === "TOTP" && userHasTotp) {
      return "TOTP";
    }
    return availableMethods[0] || "MESSAGING";
  }, [
    initialMethod,
    availableMethods,
    activeTransit?.verificationMethod,
    userHasTotp,
  ]);

  const [activeMethod, setActiveMethod] =
    useState<VerifyIdentityMethod>(defaultMethod);

  /**
   * Switches active verification strategy if available.
   */
  const switchMethod = useCallback(
    (method: VerifyIdentityMethod) => {
      setInlineMsg(null);
      if (availableMethods.includes(method)) {
        setActiveMethod(method);
      }
    },
    [availableMethods, setInlineMsg],
  );

  /**
   * Computes alternative verification methods excluding the current active method.
   */
  const alternativeMethods = useMemo(() => {
    return availableMethods.filter((m) => m !== activeMethod);
  }, [availableMethods, activeMethod]);

  /**
   * Returns corresponding button labels for a given method type.
   */
  const getMethodLabelProps = useCallback((method: VerifyIdentityMethod) => {
    switch (method) {
      case "MESSAGING":
        return AUTH_BUTTON_LABELS.verify_with_email_phone;
      case "TOTP":
        return AUTH_BUTTON_LABELS.verify_with_authenticator;
      case "SECURITY_QUESTIONS":
        return AUTH_BUTTON_LABELS.verify_with_security_questions;
      default:
        return AUTH_BUTTON_LABELS.verify_with_email_phone;
    }
  }, []);

  return {
    activeMethod,
    switchMethod,
    availableMethods,
    alternativeMethods,
    getMethodLabelProps,
    activeTransit,
    timeLeft,
  };
};
