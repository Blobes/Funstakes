"use client";

import React from "react";
import { Stack } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsgUI,
  ProgressUI,
  TransText,
  UIGuide,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_INPUT,
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  COMMON_BUTTON_LABELS,
} from "@repo/core";
import { useStaticTranslation, useGuides } from "@repo/shared-hooks";
import { useReset } from "./useReset";
import { ResetStepProps } from "../types";

/**
 * Secure step component enforcing dynamic mutation updates inside authorized timeframes.
 */
export const NewPasswordStep: React.FC<ResetStepProps> = ({
  step,
  setStep,
  style = {},
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();

  const {
    password,
    passwordVisualStates,
    isPasswordValid,
    confirmPassword,
    confirmPassErrMsg,
    handlePasswordChange,
    handleConfirmChange,
    isNewPasswordLoading,
    inlineMsg,
    timeLeft,
    isNewPasswordSubmitDisabled,
    handleResetCancel,
    handleNewPasswordSubmit,
  } = useReset({ step, setStep });

  return (
    <Stack sx={{ gap: theme.gap(10), alignItems: "center" }}>
      <Stack
        sx={{
          width: "100%",
          gap: theme.gap(8),
          paddingBottom: theme.boxSpacing(8),
        }}
      >
        <TransText
          {...AUTH_FEEDBACK.set_new_password_headline}
          component="h3"
          sx={{
            ...theme.typography.h6,
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.set_new_password_tagline}
          component="p"
          sx={{
            ...theme.typography.text3,
            textAlign: "center",
            color: theme.palette.gray[200],
          }}
        />
      </Stack>

      {inlineMsg && <InlineMsgUI msg={inlineMsg} type="ERROR" />}

      {/* Form */}
      <Stack
        sx={{ gap: theme.gap(8), width: "100%" }}
        component="form"
        onSubmit={handleNewPasswordSubmit}
      >
        <Stack
          sx={{
            gap: theme.gap(8),
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {/* Cancel CTA */}
          <AppButton
            variant="text"
            size="small"
            onClick={handleResetCancel}
            options={{ disabled: isNewPasswordLoading }}
            style={{
              color: theme.palette.error.dark,
            }}
          >
            <TransText {...COMMON_BUTTON_LABELS.cancel} noComponent />
          </AppButton>
          {/* Timer */}
          <span
            style={{
              ...theme.typography.text4,
              color: theme.palette.primary.dark,
              background: theme.fixedColors.pTrans,
              alignSelf: "center",
              padding: theme.boxSpacing(3, 5),
              borderRadius: theme.radius[2],
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </Stack>

        {/* Password */}
        <PasswordInput
          label={translateTxtString(AUTH_INPUT.label.password)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.create_password,
          )}
          onChange={handlePasswordChange}
          value={password}
          error={password !== "" && !isPasswordValid}
          inputGuideUI={
            <UIGuide
              guides={[INPUT_GUIDES.PASSWORD]}
              showTitle={false}
              detailVisuals={passwordVisualStates}
              containerStyle={{
                backgroundColor: theme.palette.gray.trans[1],
                borderRadius: theme.radius[2],
              }}
            />
          }
        />
        {/* Confirm Password */}
        <PasswordInput
          label={translateTxtString(AUTH_INPUT.label.confirm_password)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.re_enter_password,
          )}
          onChange={handleConfirmChange}
          helperText={confirmPassErrMsg}
          value={confirmPassword}
          error={confirmPassword !== "" && password !== confirmPassword}
        />

        {/* Submit CTA */}
        <AppButton
          variant="contained"
          submit
          style={{
            width: "100%",
          }}
          options={{
            disabled: isNewPasswordSubmitDisabled,
          }}
        >
          {isNewPasswordLoading ? (
            <ProgressUI options={{ size: 25 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.reset_password} noComponent />
          )}
        </AppButton>
      </Stack>
    </Stack>
  );
};
