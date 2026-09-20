"use client";

import React from "react";
import { IconButton, Stack } from "@mui/material";
import {
  AppButton,
  PasswordInput,
  InlineMsgUI,
  BasicTooltip,
  ProgressUI,
  TransText,
  AnchorLink,
  DisplayFeedbackUI,
  ChoiceInput,
  SVGWrapper,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { Pencil } from "lucide-react";
import { useLogin } from "./hooks/useLogin";
import { LoginProps } from "../types";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  COMMON_INPUT,
} from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { asset } from "@repo/assets";

export const PasswordStep: React.FC<LoginProps> = ({
  identifier,
  inputType,
  setStep,
  style = {},
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  // Consuming the controller
  const {
    password,
    passwordValidity,
    errorMsg,
    handlePasswordChange,
    handleResetPassClick,
    handleSubmit,
    isAuthLoading,
    inlineMsg,
    inlineMsgStyle,
    setInlineMsg,
    isLocked,
    MAX_ATTEMPTS,
    LOCKOUT_MIN,
    formattedSec,
    rememberMe,
    handleRememberMe,
  } = useLogin({ identifier, inputType, setStep });

  return !isLocked ? (
    <Stack
      sx={{
        width: "90%",
        gap: theme.gap(8),
        [theme.breakpoints.down("md")]: {
          width: "100%",
        },
      }}
    >
      <SVGWrapper
        src={asset.shield}
        size={70}
        color={theme.palette.primary.dark}
        fallbackUIType="SKELETON"
        sx={{
          flex: "none",
          alignSelf: "center",
        }}
      />
      {/* Headline & Tagline */}
      <Stack sx={{}}>
        <TransText
          {...COMMON_FEEDBACK.welcome_back()}
          component="h3"
          sx={{
            ...theme.typography.h6,
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.enter_password_to_login(MAX_ATTEMPTS, LOCKOUT_MIN)}
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(8),
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {/* Feedback UI */}
      {!isAuthLoading && inlineMsg && (
        <InlineMsgUI msg={inlineMsg} type="ERROR" />
      )}

      {/* Form */}
      <Stack
        sx={{
          gap: theme.gap(24),
        }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack sx={{ gap: theme.gap(8) }}>
          {/* User Identifier Snapshot */}
          <Stack direction="row" gap={theme.gap(2)}>
            <TransText
              component="p"
              sx={{
                ...theme.typography.text4,
                textAlign: "left",
                padding: theme.boxSpacing(4, 6),
                borderRadius: theme.radius[3],
                color: theme.palette.primary.dark,
                backgroundColor: theme.fixedColors.pTrans,
                width: "100%",
                fontWeight: "500",
              }}
            >
              {identifier}
            </TransText>
            <BasicTooltip
              title={translateTxtString(AUTH_BUTTON_LABELS.change_credential)}
            >
              <IconButton
                sx={{
                  padding: theme.boxSpacing(4, 4),
                  color: theme.palette.gray[300],
                  borderRadius: theme.radius[3],
                  width: "44px",
                  backgroundColor: theme.fixedColors.pTrans,
                }}
                onClick={() => {
                  setInlineMsg(null);
                  setStep?.("IDENTIFIER");
                }}
              >
                <Pencil
                  style={{ width: "18px", stroke: theme.palette.gray[300] }}
                />
              </IconButton>
            </BasicTooltip>
          </Stack>
          {/* Password Input Field */}
          <PasswordInput
            required
            label={translateTxtString(AUTH_INPUT.label.password)}
            placeholder={translateTxtString(
              AUTH_INPUT.placeholder.enter_password,
            )}
            onChange={handlePasswordChange}
            helperText={errorMsg}
            value={password}
            error={password === "" && passwordValidity === "INVALID"}
          />

          {/* Remember Me Option */}
          <ChoiceInput
            choiceType="checkbox"
            label={translateTxtString(COMMON_INPUT.label.remember_me)}
            checked={rememberMe}
            onChoiceChange={handleRememberMe}
            tooltipGuide={translateTxtString(COMMON_FEEDBACK.remember_me_guide)}
          />
        </Stack>

        <Stack sx={{ gap: theme.gap(12) }}>
          {/* Submit CTA */}
          <AppButton
            variant="contained"
            submit
            style={{
              width: "100%",
            }}
            options={{
              disabled:
                passwordValidity === "INVALID" ||
                password === "" ||
                isLocked ||
                isAuthLoading,
            }}
          >
            {isAuthLoading ? (
              <ProgressUI options={{ size: 25 }} />
            ) : (
              <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
            )}
          </AppButton>
          {/* Password Reset CTA */}
          <AnchorLink
            href={CLIENT_ROUTES.resetPassword.path}
            onClick={handleResetPassClick}
            style={{
              color: theme.palette.primary.dark,
              flex: "none",
              alignSelf: "center",
              "&:hover": {
                textAlign: "center",
                textDecoration: "underline",
                fontWeight: 600,
              },
            }}
          >
            <TransText {...COMMON_BUTTON_LABELS.reset_password} noComponent />
          </AnchorLink>
        </Stack>
      </Stack>
    </Stack>
  ) : (
    <DisplayFeedbackUI
      type="UNAUTHORIZED"
      headline={translateTxtString(AUTH_FEEDBACK.password_locked_headline)}
      tagline={
        <TransText
          noComponent
          {...AUTH_FEEDBACK.password_locked_tagline(formattedSec)}
          inlineComponents={{ timer: <strong style={inlineMsgStyle} /> }}
        />
      }
      primaryCta={{
        label: translateTxtString(AUTH_BUTTON_LABELS.reset_password),
        action: () => {
          handleResetPassClick;
        },
      }}
      secondaryCta={{
        label: translateTxtString(COMMON_BUTTON_LABELS.back),
        action: () => setStep?.("IDENTIFIER"),
      }}
    />
  );
};
