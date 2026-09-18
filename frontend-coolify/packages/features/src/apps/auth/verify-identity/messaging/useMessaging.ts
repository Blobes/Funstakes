"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  TransitPurpose,
  OtpMessageChannel,
  useGlobalStore,
  AUTH_FEEDBACK,
  ApiError,
  IdentifierType,
  SMS_DISPATCH_COUNTRY_CODES,
  SNACKBAR_DURATION,
} from "@repo/core";
import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import {
  extractCountryCode,
  extractPayloadKeys,
  getFromLocalStorage,
  getOtpIdentifierType,
  saveToLocalStorage,
} from "@repo/helpers";
import { VerifyIdentityService, OtpRequest } from "../services";
import { useFeedback } from "../useFeedback";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
  resolveChannelRecipient,
} from "../helpers";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { useWhatsAppStatus } from "./useWhatsapp";

const HOUR_IN_MS = 12 * 60 * 60 * 1000; // 12 Hours
const LAST_DISPATCH_STORAGE_KEY = "otp_last_dispatch_time";

/**
 * Checks whether required duration elapsed since last dispatch.
 */
const canAutoDispatchOtp = (): boolean => {
  const lastDispatchTime = getFromLocalStorage<number>({
    key: LAST_DISPATCH_STORAGE_KEY,
  });
  if (!lastDispatchTime) return true;
  return Date.now() - Number(lastDispatchTime) >= HOUR_IN_MS;
};

const ALL_CHANNELS: OtpMessageChannel[] = ["EMAIL", "WHATSAPP", "SMS"];

/**
 * Handles messaging OTP logic, resend timers, and state transitions.
 */
export const useMessagingOtp = <P extends TransitPurpose>(
  props: BaseVerificationProps<P> = {},
) => {
  const {
    activeTransit,
    onRateLimitExceeded,
    isBotChallengeAllowed,
    onSuccess,
  } = props;

  const {
    verifyMsgCode,
    dispatchMsgCode,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    commitAccountUpdate,
  } = VerifyIdentityService();

  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const authUser = useGlobalStore((state) => state.authUser);
  const { setSBMessage } = useSnackbar();
  const {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  } = useFeedback();
  const { translateTxtString } = useStaticTranslation();

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  const transitIdentifier = activeTransit?.identifier;
  const transitPurpose = activeTransit?.purpose;
  const dispatchOnload = activeTransit?.dispatchOnload ?? true;
  const transitDeviceId = activeTransit?.deviceId;
  const transitHeadline = activeTransit?.text?.headline;

  const hasDispatchedOnLoad = useRef(false);
  const initialIdentifierRef = useRef(transitIdentifier);

  const hasUserCtx =
    authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified;

  const [recipient, setRecipient] = useState<string | undefined>(
    initialIdentifierRef.current,
  );

  const isAuthPurpose =
    transitPurpose === "LOGIN_VERIFICATION" ||
    transitPurpose === "SIGNUP_VERIFICATION" ||
    transitPurpose === "PASSWORD_RESET";
  const isMfaActivationPurpose = transitPurpose === "MFA_ACTIVATION";
  const isUpdatePurpose = transitPurpose === "IDENTIFIER_UPDATE";

  /**
   * Resolves target email by evaluating active transit session or auth user payload.
   */
  const targetEmail = useMemo(() => {
    return resolveChannelRecipient(
      activeTransit,
      "EMAIL",
      recipient || initialIdentifierRef.current,
    );
  }, [activeTransit, recipient]);

  /**
   * Resolves target phone by evaluating active transit session or auth user payload.
   */
  const targetPhone = useMemo(() => {
    return resolveChannelRecipient(
      activeTransit,
      "PHONE_NUMBER",
      recipient || initialIdentifierRef.current,
    );
  }, [activeTransit, recipient]);

  const {
    isWhatsappActive,
    isCheckingWhatsapp,
    validateStatus,
    statusMsg: whatsappStatusMsg,
  } = useWhatsAppStatus({ phoneNumber: targetPhone });

  const allowedChannels = useMemo<OtpMessageChannel[]>(() => {
    if (transitPurpose === "SIGNUP_VERIFICATION") {
      return ["EMAIL"];
    }
    if (transitPurpose === "MFA_ACTIVATION") {
      return ["WHATSAPP", "SMS"];
    }
    return ALL_CHANNELS;
  }, [transitPurpose]);

  const isSmsAllowed = useMemo(() => {
    if (!targetPhone) return false;

    const countryCode = extractCountryCode(
      targetPhone,
      SMS_DISPATCH_COUNTRY_CODES,
    );
    return Boolean(
      countryCode && SMS_DISPATCH_COUNTRY_CODES.includes(countryCode),
    );
  }, [targetPhone]);

  /**
   * Resolves default channel strictly based on supported and available parameters.
   */
  const defaultChannel: OtpMessageChannel | undefined = useMemo(() => {
    const preferredChannel = activeTransit?.otpMessageChannel;
    const hasWhatsapp = Boolean(targetPhone && isWhatsappActive);
    const hasSms = Boolean(targetPhone && isSmsAllowed);
    const hasEmail = Boolean(targetEmail);

    if (preferredChannel && allowedChannels.includes(preferredChannel)) {
      if (preferredChannel === "EMAIL" && hasEmail) return "EMAIL";
      if (preferredChannel === "WHATSAPP" && hasWhatsapp) return "WHATSAPP";
      if (preferredChannel === "SMS" && hasSms) return "SMS";
    }

    if (allowedChannels.includes("EMAIL") && hasEmail) return "EMAIL";
    if (allowedChannels.includes("WHATSAPP") && hasWhatsapp) return "WHATSAPP";
    if (allowedChannels.includes("SMS") && hasSms) return "SMS";

    return undefined;
  }, [
    allowedChannels,
    isWhatsappActive,
    targetPhone,
    targetEmail,
    isSmsAllowed,
    activeTransit?.otpMessageChannel,
  ]);

  const [msgChannel, setMsgChannel] = useState<OtpMessageChannel | undefined>(
    defaultChannel,
  );

  const activeChannel = msgChannel ?? defaultChannel;

  const verificationStrategies = useMemo(
    () =>
      createVerificationStrategies({
        handleAuthSuccess,
        handleAccountUpdateSuccess,
        handlePassResetSuccess,
        handleMfaActivationSuccess,
        recipient,
      }),
    [
      handleAuthSuccess,
      handleAccountUpdateSuccess,
      handlePassResetSuccess,
      handleMfaActivationSuccess,
      recipient,
    ],
  );

  useEffect(() => {
    if (transitIdentifier) {
      initialIdentifierRef.current = transitIdentifier;
    }
  }, [transitIdentifier]);

  // Ensure active channel syncs recipient correctly when channel or default channel changes
  useEffect(() => {
    if (activeChannel) {
      const targetType: IdentifierType =
        activeChannel === "EMAIL" ? "EMAIL" : "PHONE_NUMBER";
      const resolvedRecipient = resolveChannelRecipient(
        activeTransit,
        targetType,
        recipient || initialIdentifierRef.current,
      );
      if (resolvedRecipient && resolvedRecipient !== recipient) {
        setRecipient(resolvedRecipient);
      }
    }
  }, [activeChannel, activeTransit, recipient]);

  // Sync state if defaultChannel shifts
  useEffect(() => {
    if (defaultChannel && !msgChannel) {
      setMsgChannel(defaultChannel);
    }
  }, [defaultChannel, msgChannel]);

  // Cooldown Timer for otp resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setInlineMsg(null);
    }
  }, [timer, setInlineMsg]);

  /**
   * Dispatches OTP payload using messaging service provider.
   */
  const { mutate: executeDispatch, isPending: isSending } = useMutation({
    mutationFn: async (request: OtpRequest) => {
      return await dispatchMsgCode(request);
    },
    onSuccess: (_, vars) => {
      saveToLocalStorage<number>(LAST_DISPATCH_STORAGE_KEY, Date.now());
      setTimer(60);
      setCode("");
      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.new_code_sent_tagline(
              vars.messageChannel?.toLowerCase() || "email",
            ),
          ),
          msgStatus: "SUCCESS",
          duration: SNACKBAR_DURATION.SECS_6,
        },
      });
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.localizedErrMsg ||
        translateTxtString(AUTH_FEEDBACK.otp_send_code_failed);

      const retryAfter = error.retryAfter ?? error.payload?.retryAfter;

      if (typeof retryAfter === "number" && retryAfter > 0) {
        setTimer(retryAfter);
        setInlineMsg(errMsg);
        return;
      }

      if (error.httpStatus === 429) {
        const canTriggerChallenge = isBotChallengeAllowed
          ? isBotChallengeAllowed()
          : true;

        if (canTriggerChallenge) {
          onRateLimitExceeded?.();
        } else {
          setInlineMsg(errMsg);
        }
        return;
      }
      setInlineMsg(errMsg);
    },
  });

  /**
   * Triggers OTP delivery process.
   */
  const handleSendOtp = useCallback(
    async (customRequest?: OtpRequest) => {
      setInlineMsg(null);

      const targetChannel = customRequest?.messageChannel || activeChannel;
      const resolvedChannelType: IdentifierType =
        targetChannel === "EMAIL" ? "EMAIL" : "PHONE_NUMBER";

      const targetRecipient =
        customRequest?.recipient ||
        resolveChannelRecipient(
          activeTransit,
          resolvedChannelType,
          recipient || initialIdentifierRef.current,
        );

      if (!targetRecipient || !targetChannel) {
        setInlineMsg(
          translateTxtString(AUTH_FEEDBACK.otp_identifier_and_channel_required),
        );
        return;
      }

      if (targetChannel === "WHATSAPP") {
        const isValid = await validateStatus(targetRecipient);
        if (!isValid) {
          setInlineMsg(whatsappStatusMsg);
          return;
        }
      }

      if (customRequest) {
        setRecipient(customRequest.recipient);
        executeDispatch(customRequest);
        return;
      }

      executeDispatch({
        recipient: targetRecipient,
        messageChannel: targetChannel,
      });
    },
    [
      activeChannel,
      recipient,
      transitIdentifier,
      validateStatus,
      executeDispatch,
      setInlineMsg,
      whatsappStatusMsg,
      translateTxtString,
    ],
  );

  useEffect(() => {
    if (hasDispatchedOnLoad.current) return;
    const canDispatch = dispatchOnload && (activeTransit || hasUserCtx);
    if (canDispatch && activeChannel) {
      hasDispatchedOnLoad.current = true;
      if (canAutoDispatchOtp()) {
        queueMicrotask(() => {
          handleSendOtp();
        });
      }
    }
  }, [activeTransit, hasUserCtx, dispatchOnload, handleSendOtp, activeChannel]);

  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (params: {
      purpose?: TransitPurpose;
      method: () => Promise<unknown>;
    }) => {
      const response = await params.method();

      if (!isUpdatePurpose) {
        const payloadData = (response as { payload?: Record<string, unknown> })
          ?.payload;

        const { identifier, verificationToken, otpIdentifierType } =
          extractPayloadKeys(payloadData, [
            "identifier",
            "verificationToken",
            "otpIdentifierType",
          ]);
        await commitAccountUpdate({
          identifier: identifier as string | undefined,
          targetDeviceId: transitDeviceId,
          purpose: params.purpose,
          otpIdentifierType: otpIdentifierType as IdentifierType | undefined,
          verificationToken: verificationToken as string | undefined,
          verificationMethod: "MESSAGING",
        });
      }
      return response;
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

  const handleVerify = useCallback(
    async (verificationCode?: string) => {
      setInlineMsg(null);
      const finalCode = verificationCode || code;

      if (!activeTransit) {
        setInlineMsg(
          translateTxtString(
            AUTH_FEEDBACK.missing_verification_session("MESSAGING"),
          ),
        );
        return;
      }
      if (finalCode.length < 6) return;

      const targetIdentifier = transitIdentifier || recipient;

      if (activeChannel === "WHATSAPP") {
        const isValid = await validateStatus(targetIdentifier);
        if (!isValid) {
          setInlineMsg(whatsappStatusMsg);
          return;
        }
      }

      const method = (() => {
        if (isAuthPurpose || isMfaActivationPurpose) {
          return () =>
            verifyMsgCode({
              recipient: targetIdentifier,
              code: finalCode,
              purpose: transitPurpose,
            });
        }
        if (isUpdatePurpose) {
          return activeChannel === "EMAIL"
            ? () => finalizeEmailUpdateOtp(finalCode)
            : () => finalizePhoneUpdateOtp(finalCode);
        }
        return null;
      })();

      if (!method) {
        setInlineMsg(
          translateTxtString(AUTH_FEEDBACK.unsupported_verification_method),
        );
        return;
      }
      await executeVerify({ purpose: transitPurpose, method });
    },
    [
      activeTransit,
      transitIdentifier,
      code,
      activeChannel,
      recipient,
      validateStatus,
      whatsappStatusMsg,
      isAuthPurpose,
      isMfaActivationPurpose,
      isUpdatePurpose,
      verifyMsgCode,
      finalizeEmailUpdateOtp,
      finalizePhoneUpdateOtp,
      executeVerify,
      setInlineMsg,
      translateTxtString,
      transitPurpose,
    ],
  );

  /**
   * Switches execution delivery channel.
   */
  const switchChannel = useCallback(
    async (targetChannel: OtpMessageChannel) => {
      setInlineMsg(null);

      if (!allowedChannels.includes(targetChannel)) {
        setInlineMsg(
          translateTxtString(AUTH_FEEDBACK.unsupported_verification_method),
        );
        return;
      }

      if (!activeTransit && !hasUserCtx) {
        setInlineMsg(translateTxtString(AUTH_FEEDBACK.otp_send_code_failed));
        return;
      }

      if (targetChannel === "SMS" && !isSmsAllowed) {
        setInlineMsg(
          translateTxtString(AUTH_FEEDBACK.otp_phone_region_not_supported),
        );
        return;
      }

      const nextIdentifierType: IdentifierType =
        targetChannel === "EMAIL" ? "EMAIL" : "PHONE_NUMBER";

      const nextDest = resolveChannelRecipient(
        activeTransit,
        nextIdentifierType,
        recipient || initialIdentifierRef.current,
      );

      if (!nextDest) {
        setSBMessage({
          msg: {
            tagline: translateTxtString(
              AUTH_FEEDBACK.no_email_or_phone(targetChannel.toLowerCase()),
            ),
            duration: SNACKBAR_DURATION.SECS_6,
          },
        });
        return;
      }

      if (targetChannel === "WHATSAPP") {
        const isValid = await validateStatus(nextDest);
        if (!isValid) {
          setInlineMsg(whatsappStatusMsg);
          return;
        }
      }

      setTimer(0);
      setMsgChannel(targetChannel);
      setRecipient(nextDest);

      handleSendOtp({
        recipient: nextDest,
        purpose: activeTransit?.purpose,
        messageChannel: targetChannel,
      });
    },
    [
      allowedChannels,
      activeTransit,
      hasUserCtx,
      isSmsAllowed,
      recipient,
      validateStatus,
      whatsappStatusMsg,
      setSBMessage,
      translateTxtString,
      setInlineMsg,
      handleSendOtp,
    ],
  );

  /**
   * Filters alternative channels to strictly display supported and available channels only.
   */
  const alternativeChannels = useMemo(() => {
    return allowedChannels.filter((ch) => {
      if (ch === activeChannel) return false;

      const targetType: IdentifierType =
        ch === "EMAIL" ? "EMAIL" : "PHONE_NUMBER";
      const dest = resolveChannelRecipient(
        activeTransit,
        targetType,
        recipient || initialIdentifierRef.current,
      );
      if (!dest) return false;

      if (ch === "EMAIL") return Boolean(dest);
      if (ch === "SMS") return isSmsAllowed;
      if (ch === "WHATSAPP") return isWhatsappActive;
      return false;
    });
  }, [
    allowedChannels,
    activeChannel,
    activeTransit,
    recipient,
    isSmsAllowed,
    isWhatsappActive,
  ]);

  return {
    code,
    setCode,
    timer,
    isVerifying,
    isSending,
    isCheckingWhatsapp,
    handleVerify,
    handleSendOtp,
    msgChannel: activeChannel,
    switchChannel,
    recipient,
    inlineMsg,
    isSmsAllowed,
    isWhatsappActive,
    allowedChannels,
    alternativeChannels,
    isMfaActivationPurpose,
    transitHeadline,
  };
};
