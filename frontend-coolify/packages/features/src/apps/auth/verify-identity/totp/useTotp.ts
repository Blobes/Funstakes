"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AUTH_FEEDBACK,
  ApiError,
  COMMON_FEEDBACK,
  ISinglePayload,
  IUser,
  QUERY_KEYS,
  TransitPurpose,
  useGlobalStore,
} from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import {
  CommitUpdateResponse,
  TotpActionType,
  VerifyIdentityService,
} from "../services";
import { useFeedback } from "../useFeedback";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
} from "../helpers";
import { useVerificationNavigation } from "../useNavigation";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { extractPayloadKeys } from "@repo/helpers";

export type TotpViewStep = "CONFIGURE_TOTP" | "VERIFY_TOTP_CODE";

export interface UseTotpProps<
  P extends TransitPurpose,
> extends BaseVerificationProps<P> {
  currStep?: TotpViewStep;
  setCurrStep?: (step: TotpViewStep) => void;
  totpAction?: TotpActionType;
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
    currStep,
    setCurrStep,
    totpAction,
  } = props;

  const authUser = useGlobalStore((state) => state.authUser);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);

  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { fetchTotpSetup, verifyTotpCode, commitAccountUpdate } =
    VerifyIdentityService();
  const { translateTxtString } = useStaticTranslation();
  const {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  } = useFeedback();

  const { checkTotpConfiguration } = useVerificationNavigation();

  const isMfaActivationPurpose = activeTransit?.purpose === "MFA_ACTIVATION";
  const transitDeviceId = activeTransit?.deviceId;
  const transitHeadline = activeTransit?.text?.headline;

  const actionType: TotpActionType =
    totpAction || (isMfaActivationPurpose ? "CONFIGURE" : "AUTHENTICATE");

  const payloadUser = extractPayloadKeys(activeTransit?.payload, ["user"])
    .user as IUser | null;

  const targetUser = authUser || payloadUser;
  const isConfigured = checkTotpConfiguration(targetUser);

  const isConfig = isMfaActivationPurpose || actionType === "CONFIGURE";

  // Automatically select CONFIGURE_TOTP step during MFA setup or when unconfigured
  const initialStep: TotpViewStep = useMemo(() => {
    if (currStep) return currStep;
    if (isConfig || !isConfigured) return "CONFIGURE_TOTP";
    return "VERIFY_TOTP_CODE";
  }, [isMfaActivationPurpose, isConfigured, currStep]);

  useEffect(() => {
    setCurrStep?.(initialStep);
  }, [initialStep, setCurrStep]);

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
      const response = await fetchTotpSetup();
      return response.payload;
    },
    enabled: isConfig,
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

      const verifyRes = await verifyTotpCode({
        actionType,
        token,
        identifier: targetIdentifier,
      });

      let updateRes;

      if (activeTransit?.purpose) {
        updateRes = (await commitAccountUpdate({
          identifier: targetIdentifier,
          targetDeviceId: transitDeviceId,
          purpose: activeTransit.purpose,
          verificationMethod: "TOTP",
        })) as ISinglePayload<CommitUpdateResponse>;
      }

      return { verifyRes, updateRes };
    },
    onSuccess: ({ updateRes }) => {
      if (onSuccess) onSuccess();
      const accessToken = updateRes?.payload?.accessToken;
      if (activeTransit) {
        executeVerificationStrategy(
          activeTransit,
          verificationStrategies,
          accessToken,
        );
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
    setCurrStep?.("VERIFY_TOTP_CODE");
  }, [setInlineMsg]);

  /**
   * Switches view state back to configuration setup step.
   */
  const switchToConfiguration = useCallback(() => {
    setInlineMsg(null);
    setCurrStep?.("CONFIGURE_TOTP");
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
    initialStep,
    currStep,
    setCurrStep,
    isConfigured,
    handleCopyKey,
    copied,
    proceedToVerification,
    switchToConfiguration,
    isSetupError,
    isMfaActivationPurpose,
    transitHeadline,
  };
};
