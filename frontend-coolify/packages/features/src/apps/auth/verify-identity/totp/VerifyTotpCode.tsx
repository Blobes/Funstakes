"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  OtpInput,
  ProgressUI,
  TransText,
} from "@repo/shared-ui";
import { AUTH_BUTTON_LABELS, AUTH_FEEDBACK, TransitPurpose } from "@repo/core";
import { useTotp, UseTotpProps } from "./useTotp";
import { useMisc } from "@repo/shared-hooks";
import { ShieldKeyhole } from "lucide-react";

export const VerifyTotpCode = <P extends TransitPurpose>(
  props: UseTotpProps<P>,
) => {
  const { style } = props;
  const theme = useTheme();
  const { isMobile } = useMisc();

  const {
    code,
    setCode,
    isVerifying,
    switchToConfiguration,
    handleVerify,
    inlineMsg,
    isMfaActivationPurpose,
    transitHeadline,
  } = useTotp({
    ...props,
    // currStep: "VERIFY_TOTP_CODE",
  });

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
        <ShieldKeyhole
          size={isMobile ? 50 : 60}
          style={{ marginBottom: theme.boxSpacing(12) }}
        />
        <TransText
          component="h3"
          {...(transitHeadline ||
            AUTH_FEEDBACK.verify_without_msg_channel("TOTP"))}
          sx={{ ...theme.typography.h6, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.verify_with_auth_app_tagline}
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
          [theme.breakpoints.down("lg")]: { width: "100%" },
          gap: theme.gap(16),
          alignItems: "center",
        }}
      >
        {!isVerifying && inlineMsg && (
          <InlineMsgUI msg={inlineMsg} type="ERROR" />
        )}

        <OtpInput
          length={6}
          onComplete={handleVerify}
          onChange={setCode}
          disabled={isVerifying}
          style={{ input: { width: "100%" } }}
        />
        <AppButton
          submit
          variant="contained"
          onClick={() => handleVerify()}
          style={{ width: "100%" }}
          options={{ disabled: code.length < 6 || isVerifying }}
        >
          {isVerifying ? (
            <ProgressUI options={{ size: 24 }} />
          ) : (
            <TransText
              {...(isMfaActivationPurpose
                ? AUTH_BUTTON_LABELS.verify_and_activate_mfa
                : AUTH_BUTTON_LABELS.otp_verify_code)}
              noComponent
            />
          )}
        </AppButton>
      </Stack>
      {isMfaActivationPurpose && (
        <Stack
          sx={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          <TransText
            {...AUTH_FEEDBACK.need_to_scan_qr_code_again}
            sx={{ ...theme.typography.text3, width: "fit-content" }}
          />
          <AppButton
            variant="text"
            size="small"
            onClick={switchToConfiguration}
            style={{ color: theme.palette.primary.main }}
          >
            <TransText {...AUTH_BUTTON_LABELS.reconfigure} noComponent />
          </AppButton>
        </Stack>
      )}
    </Stack>
  );
};
