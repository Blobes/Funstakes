"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  ProgressIcon,
  TransText,
  DynamicInput,
} from "@repo/shared-ui";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  TransitPurpose,
} from "@repo/core";
import { useSecurityQuestions } from "./useSecurityQuestions";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { ShieldQuestionMark } from "lucide-react";
import { useMisc, useStaticTranslation } from "@repo/shared-hooks";

/**
 * Renders configured user security questions in a read-only list with answer inputs for identity verification.
 */
export const VerifySecurityQuestions = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { style } = props;
  const { isMobile } = useMisc();
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  const {
    verifyAnswers,
    isFetchingQuestions,
    handleVerifyAnswerChange,
    isVerifyFormValid,
    isVerifying,
    handleVerify,
    inlineMsg,
  } = useSecurityQuestions(props);

  return (
    <Stack
      sx={{
        gap: theme.gap(20),
        width: "100%",
        alignItems: "center",
        ...style,
      }}
    >
      <Stack
        sx={{ gap: theme.gap(2), textAlign: "center", alignItems: "center" }}
      >
        <ShieldQuestionMark size={isMobile ? 50 : 60} />

        <TransText
          component="h3"
          {...AUTH_FEEDBACK.verify_without_msg_channel("SECURITY_QUESTIONS")}
          sx={{ ...theme.typography.h6, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.verify_with_security_questions_tagline}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      <Stack
        component="form"
        sx={{
          width: "100%",
          gap: theme.gap(16),
          alignItems: "center",
        }}
      >
        {!isVerifying && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        {isFetchingQuestions ? (
          <ProgressIcon options={{ size: 32 }} />
        ) : (
          verifyAnswers.map((item, index) => (
            <DynamicInput
              key={index}
              label={item.question}
              placeholder={translateTxtString(
                AUTH_INPUT.placeholder.type_your_answer,
              )}
              value={item.answer}
              onChange={(e) => handleVerifyAnswerChange(index, e.target.value)}
              onClear={() => handleVerifyAnswerChange(index, "")}
              disabled={isVerifying}
              allowReset
            />
          ))
        )}

        <AppButton
          submit
          variant="contained"
          onClick={() => handleVerify()}
          style={{ width: "100%" }}
          options={{
            disabled: !isVerifyFormValid || isVerifying || isFetchingQuestions,
          }}
        >
          {isVerifying ? (
            <ProgressIcon options={{ size: 24 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.otp_verify_code} noComponent />
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
