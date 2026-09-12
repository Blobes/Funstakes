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
 * Checks whether the required duration has elapsed since the last dispatch.
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

  const purpose = activeTransit?.purpose;
  const dispatchOnload = activeTransit?.dispatchOnload ?? true;

  const hasDispatchedOnLoad = useRef(false);
  const initialIdentifierRef = useRef(activeTransit?.identifier);
  const hasUserCtx =
    authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified;

  const [recipient, setRecipient] = useState<string | undefined>(
    activeTransit?.identifier,
  );

  const targetPhone =
    recipient ||
    activeTransit?.identifier ||
    initialIdentifierRef.current ||
    authUser?.phoneNumber;

  const isAuthPurpose =
    purpose === "LOGIN_VERIFICATION" ||
    purpose === "SIGNUP_VERIFICATION" ||
    purpose === "PASSWORD_RESET";
  const isMfaActivationPurpose = purpose === "MFA_ACTIVATION";
  const isUpdatePurpose = purpose === "IDENTIFIER_UPDATE";

  const {
    isWhatsappActive,
    isCheckingWhatsapp,
    validateStatus,
    statusMsg: whatsappStatusMsg,
  } = useWhatsAppStatus({ phoneNumber: targetPhone });

  const allowedChannels = useMemo<OtpMessageChannel[]>(() => {
    if (purpose === "SIGNUP_VERIFICATION") {
      return ["EMAIL"];
    }
    if (purpose === "MFA_ACTIVATION") {
      return ["WHATSAPP", "SMS"];
    }
    return ALL_CHANNELS;
  }, [purpose]);

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
   * Resolves default channel based on availability and transit context.
   */
  const defaultChannel: OtpMessageChannel = useMemo(() => {
    const preferredChannel = activeTransit?.otpMessageChannel;
    if (purpose === "MFA_ACTIVATION") {
      if (isWhatsappActive) return "WHATSAPP";
      if (targetPhone && isSmsAllowed) return "SMS";
      return preferredChannel || "EMAIL";
    }
    return preferredChannel || "EMAIL";
  }, [
    purpose,
    isWhatsappActive,
    targetPhone,
    isSmsAllowed,
    activeTransit?.otpMessageChannel,
  ]);

  const [msgChannel, setMsgChannel] =
    useState<OtpMessageChannel>(defaultChannel);

  const verificationStrategies = useMemo(
    () =>
      createVerificationStrategies({
        handleAuthSuccess,
        handleAccountUpdateSuccess,
        handlePassResetSuccess,
        handleMfaActivationSuccess,
        recipient: recipient || initialIdentifierRef.current,
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
    if (activeTransit?.identifier) {
      initialIdentifierRef.current = activeTransit.identifier;
    }
  }, [activeTransit?.identifier]);

  useEffect(() => {
    if (activeTransit?.identifier && !recipient) {
      setRecipient(activeTransit.identifier);
    }
    setMsgChannel(defaultChannel);
  }, [activeTransit?.identifier, defaultChannel, recipient]);

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

      const targetChannel = customRequest?.messageChannel || msgChannel;
      const targetRecipient =
        customRequest?.recipient ||
        recipient ||
        activeTransit?.identifier ||
        initialIdentifierRef.current ||
        (targetChannel === "EMAIL" ? authUser?.email : authUser?.phoneNumber);

      if (!targetRecipient || !targetChannel) return;

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
      msgChannel,
      recipient,
      activeTransit,
      authUser?.email,
      authUser?.phoneNumber,
      validateStatus,
      executeDispatch,
      setInlineMsg,
      whatsappStatusMsg,
    ],
  );

  useEffect(() => {
    if (hasDispatchedOnLoad.current) return;
    const canDispatch = dispatchOnload && (activeTransit || hasUserCtx);
    if (canDispatch) {
      hasDispatchedOnLoad.current = true;
      if (canAutoDispatchOtp()) {
        queueMicrotask(() => {
          handleSendOtp();
        });
      }
    }
  }, [activeTransit, hasUserCtx, dispatchOnload, handleSendOtp]);

  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (params: {
      purpose: TransitPurpose;
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
          purpose: params.purpose,
          otpIdentifierType: otpIdentifierType as IdentifierType | undefined,
          verificationToken: verificationToken as string | undefined,
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

      const activePurpose = activeTransit.purpose;
      const targetIdentifier =
        activeTransit.identifier ||
        recipient ||
        initialIdentifierRef.current ||
        "";

      if (msgChannel === "WHATSAPP") {
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
              purpose: activePurpose,
            });
        }
        if (isUpdatePurpose) {
          return msgChannel === "EMAIL"
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
      await executeVerify({ purpose: activePurpose, method });
    },
    [
      activeTransit,
      code,
      msgChannel,
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

  const alternativeChannels = allowedChannels.filter((ch) => {
    if (ch === msgChannel) return false;
    if (ch === "SMS") return isSmsAllowed;
    if (ch === "WHATSAPP") return isWhatsappActive;
    return true;
  });

  return {
    code,
    setCode,
    timer,
    isVerifying,
    isSending,
    isCheckingWhatsapp,
    handleVerify,
    handleSendOtp,
    msgChannel,
    switchChannel,
    recipient,
    inlineMsg,
    isSmsAllowed,
    isWhatsappActive,
    allowedChannels,
    alternativeChannels,
    isMfaActivationPurpose,
  };
};
