"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  TransitPurpose,
  useGlobalStore,
  AUTH_FEEDBACK,
  ApiError,
  ITranslation,
  AUTH_SECURITY_QUESTIONS,
  QUERY_KEYS,
  SNACKBAR_DURATION,
} from "@repo/core";
import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import { SelectOption } from "@repo/shared-ui";
import { VerifyIdentityService } from "../services";
import { useFeedback } from "../useFeedback";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
} from "../helpers";
import { BaseVerificationProps } from "../useVerifyIdentity";

export const SECURITY_QUESTIONS = (
  translateTxtString: (transData: ITranslation) => string,
) =>
  [
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_1),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_2),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_3),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_4),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_5),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_6),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_7),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_8),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_9),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_10),
  ] as const;

export type SecurityQuestion = ReturnType<typeof SECURITY_QUESTIONS>[number];

export interface SetupQuestionState {
  question: SecurityQuestion | "";
  answer: string;
}

export interface VerifyAnswerState {
  question: string;
  answer: string;
}

/**
 * Handles security questions setup and verification logic, fetching, state management, and API submissions.
 */
export const useSecurityQuestions = <P extends TransitPurpose>(
  props: BaseVerificationProps<P> = {},
) => {
  const {
    activeTransit,
    onRateLimitExceeded,
    isBotChallengeAllowed,
    onSuccess,
  } = props;

  const {
    fetchSecurityQuestions,
    verifySecurityQuestions,
    setupSecurityQuestions,
    commitAccountUpdate,
  } = VerifyIdentityService();

  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const { setSBMessage } = useSnackbar();
  const {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  } = useFeedback();
  const { translateTxtString } = useStaticTranslation();

  const targetIdentifier = activeTransit?.identifier || "";
  const purpose = activeTransit?.purpose;

  const [setupStates, setSetupStates] = useState<SetupQuestionState[]>([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const [verifyAnswers, setVerifyAnswers] = useState<VerifyAnswerState[]>([]);

  const verificationStrategies = useMemo(
    () =>
      createVerificationStrategies({
        handleAuthSuccess,
        handleAccountUpdateSuccess,
        handlePassResetSuccess,
        handleMfaActivationSuccess,
        recipient: targetIdentifier,
      }),
    [
      handleAuthSuccess,
      handleAccountUpdateSuccess,
      handlePassResetSuccess,
      handleMfaActivationSuccess,
      targetIdentifier,
    ],
  );

  const isMfaActivationPurpose = purpose === "MFA_ACTIVATION";

  /**
   * Queries configured user security questions for verification flow.
   */
  const {
    data: fetchedQuestionsData,
    isLoading: isFetchingQuestions,
    error: fetchQuestionsError,
  } = useQuery({
    queryKey: QUERY_KEYS.SECURITY_QUESTIONS_CONFIG(targetIdentifier),
    queryFn: async () => {
      const res = await fetchSecurityQuestions(targetIdentifier);
      return res.payload?.questions || [];
    },
    enabled: Boolean(targetIdentifier) && !isMfaActivationPurpose,
  });

  useEffect(() => {
    if (fetchedQuestionsData && fetchedQuestionsData.length > 0) {
      setVerifyAnswers(
        fetchedQuestionsData.map((q) => ({
          question: q,
          answer: "",
        })),
      );
    }
  }, [fetchedQuestionsData]);

  useEffect(() => {
    if (fetchQuestionsError) {
      const err = fetchQuestionsError as ApiError;
      setInlineMsg(
        err.localizedErrMsg ||
          translateTxtString(
            AUTH_FEEDBACK.security_questions_verification_failed,
          ),
      );
    }
  }, [fetchQuestionsError, setInlineMsg, translateTxtString]);

  /**
   * Computes available select options for setup fields by excluding questions selected in other fields.
   */
  const getOptionsForIndex = useCallback(
    (index: number): SelectOption[] => {
      const selectedElsewhere = setupStates
        .filter((_, i) => i !== index)
        .map((qs) => qs.question)
        .filter((q): q is SecurityQuestion => Boolean(q));

      return SECURITY_QUESTIONS(translateTxtString)
        .filter((q) => !selectedElsewhere.includes(q))
        .map((q) => ({
          id: q,
          value: q,
          title: q,
        }));
    },
    [setupStates, translateTxtString],
  );

  /**
   * Updates question selection at a specific setup index.
   */
  const handleSetupQuestionChange = useCallback(
    (index: number, option: SelectOption) => {
      setSetupStates((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          question: option.value as SecurityQuestion,
        };
        return updated;
      });
    },
    [],
  );

  /**
   * Updates answer value at a specific setup index.
   */
  const handleSetupAnswerChange = useCallback(
    (index: number, answer: string) => {
      setSetupStates((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], answer };
        return updated;
      });
    },
    [],
  );

  /**
   * Clears selection and answer at a specific setup index.
   */
  const handleSetupClear = useCallback((index: number) => {
    setSetupStates((prev) => {
      const updated = [...prev];
      updated[index] = { question: "", answer: "" };
      return updated;
    });
  }, []);

  /**
   * Updates answer value for verification at a specific index.
   */
  const handleVerifyAnswerChange = useCallback(
    (index: number, answer: string) => {
      setVerifyAnswers((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], answer };
        return updated;
      });
    },
    [],
  );

  /**
   * Triggers a snackbar feedback prompt when an answer input field is interacted with prior to question selection.
   */
  const handleAnswerClick = useCallback(
    (index: number) => {
      const targetField = setupStates[index];

      if (!targetField?.question) {
        setSBMessage({
          msg: {
            tagline: translateTxtString(
              AUTH_FEEDBACK.select_security_question_first,
            ),
            msgStatus: "ERROR",
            duration: SNACKBAR_DURATION.SECS_6,
          },
        });
      }
    },
    [setupStates, setSBMessage, translateTxtString],
  );

  const isSetupFormValid = useMemo(() => {
    return setupStates.every(
      (qs) => Boolean(qs.question) && qs.answer.trim().length > 0,
    );
  }, [setupStates]);

  const isVerifyFormValid = useMemo(() => {
    return (
      verifyAnswers.length > 0 &&
      verifyAnswers.every((va) => va.answer.trim().length > 0)
    );
  }, [verifyAnswers]);

  /**
   * Mutation handling security questions setup API dispatch.
   */
  const { mutateAsync: executeSetup, isPending: isSettingUp } = useMutation({
    mutationFn: async () => {
      const payload = {
        questions: setupStates.map((qs) => ({
          question: qs.question,
          answer: qs.answer.trim(),
        })),
      };

      const response = await setupSecurityQuestions(payload);

      if (activeTransit?.purpose) {
        await commitAccountUpdate({
          identifier: targetIdentifier,
          purpose: activeTransit.purpose,
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
          translateTxtString(
            AUTH_FEEDBACK.security_questions_verification_failed,
          ),
      );
    },
  });

  /**
   * Mutation handling security questions verification API dispatch.
   */
  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const payload = {
        identifier: targetIdentifier,
        answers: verifyAnswers.map((va) => ({
          question: va.question,
          answer: va.answer.trim(),
        })),
      };

      const response = await verifySecurityQuestions(payload);

      if (activeTransit?.purpose) {
        await commitAccountUpdate({
          identifier: targetIdentifier,
          purpose: activeTransit.purpose,
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
          translateTxtString(
            AUTH_FEEDBACK.security_questions_verification_failed,
          ),
      );
    },
  });

  /**
   * Initiates security questions setup process.
   */
  const handleSetup = useCallback(async () => {
    setInlineMsg(null);

    if (!activeTransit) {
      setInlineMsg(translateTxtString(AUTH_FEEDBACK.missing_mfa_setup_session));
      return;
    }
    if (!isSetupFormValid) return;
    await executeSetup();
  }, [
    activeTransit,
    isSetupFormValid,
    executeSetup,
    setInlineMsg,
    translateTxtString,
  ]);

  /**
   * Initiates security questions verification process.
   */
  const handleVerify = useCallback(async () => {
    setInlineMsg(null);

    if (!activeTransit) {
      setInlineMsg(
        translateTxtString(
          AUTH_FEEDBACK.missing_verification_session("SECURITY_QUESTIONS"),
        ),
      );
      return;
    }
    if (!isVerifyFormValid) return;
    await executeVerify();
  }, [
    activeTransit,
    isVerifyFormValid,
    executeVerify,
    setInlineMsg,
    translateTxtString,
  ]);

  return {
    setupStates,
    verifyAnswers,
    isFetchingQuestions,
    getOptionsForIndex,
    handleSetupQuestionChange,
    handleSetupAnswerChange,
    handleSetupClear,
    handleVerifyAnswerChange,
    handleAnswerClick,
    isSetupFormValid,
    isVerifyFormValid,
    isSettingUp,
    isVerifying,
    handleSetup,
    handleVerify,
    inlineMsg,
    isMfaActivationPurpose,
  };
};
