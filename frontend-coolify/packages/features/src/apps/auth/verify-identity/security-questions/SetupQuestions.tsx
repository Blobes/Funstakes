"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  ProgressIcon,
  TransText,
  SingleSelectInput,
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
 * Renders security question selectors and answer input fields for configuring MFA security questions.
 */
export const SetupSecurityQuestions = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { style } = props;
  const { isMobile } = useMisc();
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  const {
    setupStates,
    getOptionsForIndex,
    handleSetupQuestionChange,
    handleSetupAnswerChange,
    handleSetupClear,
    handleAnswerClick,
    isSetupFormValid,
    isSettingUp,
    handleSetup,
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
        sx={{ gap: theme.gap(8), textAlign: "center", alignItems: "center" }}
      >
        <ShieldQuestionMark size={isMobile ? 50 : 60} />

        <TransText
          component="h3"
          {...AUTH_FEEDBACK.mfa_setup_without_msg_channel("SECURITY_QUESTIONS")}
          sx={{ ...theme.typography.h6, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.security_questions_mfa_setup_tagline}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      <Stack
        sx={{
          width: "100%",
          gap: theme.gap(16),
          alignItems: "center",
        }}
      >
        {!isSettingUp && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        {setupStates.map((qs, index) => {
          const isInputDisabled = isSettingUp || !qs.question;
          return (
            <Stack key={index} sx={{ width: "100%", gap: theme.gap(4) }}>
              <SingleSelectInput
                label={translateTxtString(
                  AUTH_INPUT.label.security_question(index + 1),
                )}
                placeholder={translateTxtString(
                  AUTH_INPUT.placeholder.select_a_question,
                )}
                options={getOptionsForIndex(index)}
                selectedValue={qs.question}
                onSelectChange={(option) =>
                  handleSetupQuestionChange(index, option)
                }
                onClear={() => handleSetupClear(index)}
                disabled={isSettingUp}
                multiline
                allowReset
              />
              <DynamicInput
                label={translateTxtString(AUTH_INPUT.label.answer)}
                placeholder={translateTxtString(
                  AUTH_INPUT.placeholder.type_your_answer,
                )}
                value={qs.answer}
                onChange={(e) => handleSetupAnswerChange(index, e.target.value)}
                onClear={() => handleSetupAnswerChange(index, "")}
                onDisabledClick={() => handleAnswerClick(index)}
                disabled={isInputDisabled}
                allowReset
                style={{
                  pointerEvents: isInputDisabled ? "none" : "auto",
                }}
              />
            </Stack>
          );
        })}

        <AppButton
          variant="contained"
          onClick={() => handleSetup()}
          style={{ width: "100%" }}
          options={{ disabled: !isSetupFormValid || isSettingUp }}
        >
          {isSettingUp ? (
            <ProgressIcon options={{ size: 24 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.otp_verify_code} noComponent />
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
