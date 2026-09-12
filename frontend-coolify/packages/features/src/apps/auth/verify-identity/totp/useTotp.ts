"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AUTH_FEEDBACK,
  ApiError,
  COMMON_FEEDBACK,
  QUERY_KEYS,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { TotpActionType, VerifyIdentityService } from "../services";
import { useFeedback } from "../useFeedback";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
} from "../helpers";
import { useVerificationNavigation } from "../useNavigation";
import { BaseVerificationProps } from "../useVerifyIdentity";

export type TotpViewStep = "CONFIGURE_TOTP" | "VERIFY_TOTP_CODE";

export interface UseTotpProps<
  P extends TransitPurpose,
> extends BaseVerificationProps<P> {
  viewMode?: TotpViewStep;
}

/**
 * Handles TOTP configuration and token verification operations.
 */
export const useTotp = <P extends TransitPurpose>(props: UseTotpProps<P>) => {
  const {
    activeTransit,
    onRateLimitExceeded,
    isBotChallengeAllowed,
    onSuccess,
    viewMode,
  } = props;

  const authUser = useGlobalStore((state) => state.authUser);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);

  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { setupTotp, verifyTotpCode } = VerifyIdentityService();
  const { translateTxtString } = useStaticTranslation();
  const {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  } = useFeedback();

  const { checkTotpConfiguration } = useVerificationNavigation();

  const isMfaActivationPurpose = activeTransit?.purpose === "MFA_ACTIVATION";
  const actionType: TotpActionType = isMfaActivationPurpose
    ? "CONFIGURE"
    : "AUTHENTICATE";

  const isConfigured = checkTotpConfiguration(authUser);

  // Automatically select CONFIGURE_TOTP step during MFA setup or when unconfigured
  const initialStep: TotpViewStep = useMemo(() => {
    if (viewMode) return viewMode;
    if (isMfaActivationPurpose || !isConfigured) return "CONFIGURE_TOTP";
    return "VERIFY_TOTP_CODE";
  }, [viewMode, isMfaActivationPurpose, isConfigured]);

  const [currStep, setCurrStep] = useState<TotpViewStep>(initialStep);

  useEffect(() => {
    setCurrStep(initialStep);
  }, [initialStep]);

  /**
   * Fetches the TOTP QR code and setup key configuration data.
   */
  const {
    data: setupData,
    isLoading: isLoadingSetup,
    isError: isSetupError,
    error: setupError,
    refetch: fetchSetup,
  } = useQuery({
    queryKey: QUERY_KEYS.TOTP_CONFIG(activeTransit?.identifier, authUser?._id),
    queryFn: async () => {
      const targetIdentifier =
        activeTransit?.identifier || authUser?.email || "";
      const response = await setupTotp({
        actionType,
        identifier: targetIdentifier,
      });
      return response.payload;
    },
    enabled: false, // currStep === "CONFIGURE_TOTP",
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  /**
   * Handles setup API error state feedback.
   */
  useEffect(() => {
    if (isSetupError && currStep === "CONFIGURE_TOTP") {
      const apiErr = setupError as ApiError;

      if (apiErr?.httpStatus === 429) {
        const canTriggerChallenge = isBotChallengeAllowed
          ? isBotChallengeAllowed()
          : true;

        if (canTriggerChallenge) {
          onRateLimitExceeded?.();
          return;
        }
      }
      setInlineMsg(
        apiErr?.localizedErrMsg ||
          translateTxtString(COMMON_FEEDBACK.server_error_tagline),
      );
    }
  }, [
    isSetupError,
    setupError,
    currStep,
    isBotChallengeAllowed,
    onRateLimitExceeded,
    setInlineMsg,
    translateTxtString,
  ]);

  const verificationStrategies = useMemo(
    () =>
      createVerificationStrategies({
        handleAuthSuccess: handleAuthSuccess,
        handleAccountUpdateSuccess: handleAccountUpdateSuccess,
        handlePassResetSuccess,
        handleMfaActivationSuccess,
        recipient: activeTransit?.identifier,
      }),
    [
      handleAuthSuccess,
      handleAccountUpdateSuccess,
      handlePassResetSuccess,
      handleMfaActivationSuccess,
      activeTransit?.identifier,
    ],
  );

  /**
   * Validates the TOTP token provided by the user.
   */
  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (token: string) => {
      const targetIdentifier =
        activeTransit?.identifier || authUser?.email || "";

      return await verifyTotpCode({
        actionType,
        token,
        identifier: targetIdentifier,
      });
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
      if (activeTransit) {
        executeVerificationStrategy(activeTransit, verificationStrategies);
      }
    },
    onError: (error: ApiError) => {
      if (error.httpStatus === 429) {
        const canTriggerChallenge = isBotChallengeAllowed
          ? isBotChallengeAllowed()
          : true;

        if (canTriggerChallenge) {
          onRateLimitExceeded?.();
          return;
        }
      }
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(AUTH_FEEDBACK.otp_invalid_code),
      );
    },
  });

  /**
   * Triggers the TOTP verification handler.
   */
  const handleVerify = useCallback(
    async (verificationCode?: string) => {
      setInlineMsg(null);
      const finalCode = verificationCode || code;

      if (!activeTransit && !authUser) {
        return setInlineMsg(
          translateTxtString(
            AUTH_FEEDBACK.missing_verification_session("TOTP"),
          ),
        );
      }
      if (finalCode.length < 6) return;

      await executeVerify(finalCode);
    },
    [
      activeTransit,
      authUser,
      code,
      executeVerify,
      setInlineMsg,
      translateTxtString,
    ],
  );

  /**
   * Switches view state to code verification step after setup.
   */
  const proceedToVerification = useCallback(() => {
    setInlineMsg(null);
    setCurrStep("VERIFY_TOTP_CODE");
  }, [setInlineMsg]);

  /**
   * Switches view state back to configuration setup step.
   */
  const switchToConfiguration = useCallback(() => {
    setInlineMsg(null);
    setCurrStep("CONFIGURE_TOTP");
  }, [setInlineMsg]);

  /**
   * Copies the manual setup key to the clipboard.
   */
  const handleCopyKey = () => {
    if (!setupData?.manualEntryKey) return;
    navigator.clipboard.writeText(setupData.manualEntryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    code,
    setCode,
    isVerifying,
    handleVerify,
    inlineMsg,
    setupData,
    isLoadingSetup,
    fetchSetup,
    currStep,
    setCurrStep,
    isConfigured,
    handleCopyKey,
    copied,
    proceedToVerification,
    switchToConfiguration,
    isSetupError,
  };
};
