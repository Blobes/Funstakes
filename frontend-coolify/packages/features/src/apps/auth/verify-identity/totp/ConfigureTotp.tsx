"use client";

import React from "react";
import { Stack, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  DisplayFeedbackUI,
  InlineMsgUI,
  ProgressIcon,
  SVGWrapper,
  TransText,
} from "@repo/shared-ui";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  COMMON_BUTTON_LABELS,
  TransitPurpose,
} from "@repo/core";
import { useTotp } from "./useTotp";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { useMisc, useStaticTranslation } from "@repo/shared-hooks";
import { QrCode, SquaresExclude } from "lucide-react";

/**
 * Renders the initial enrollment and configuration flow for Time-based One-Time Passwords (TOTP).
 * Generates a QR code or manual key, takes verification input, and handles fallback navigation modes.
 */
export const ConfigureTotp = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const { style } = props;
  const { isMobile } = useMisc();
  const theme = useTheme();

  const {
    fetchSetup,
    inlineMsg,
    setupData,
    isLoadingSetup,
    handleCopyKey,
    copied,
    proceedToVerification,
    isSetupError,
  } = useTotp({ ...props, viewMode: "CONFIGURE_TOTP" });

  const { translateTxtString } = useStaticTranslation();

  return (
    <Stack
      sx={{
        gap: theme.gap(28),
        width: "100%",
        alignItems: "center",
        ...style,
      }}
    >
      {/* Visual Branding & Instruction Section */}
      <Stack
        sx={{ gap: theme.gap(8), textAlign: "center", alignItems: "center" }}
      >
        <QrCode size={isMobile ? 50 : 60} />
        <TransText
          component="h3"
          {...AUTH_FEEDBACK.mfa_setup_without_msg_channel("TOTP")}
          sx={{ ...theme.typography.h6, fontWeight: 500, textAlign: "center" }}
        />
        <TransText
          {...AUTH_FEEDBACK.totp_mfa_setup_tagline}
          style={{
            ...theme.typography.text3,
            color: theme.palette.gray[200],
            textAlign: "center",
          }}
        />
      </Stack>

      {/* Secret Exchange Presentation (QR Code & Manual Setup Key) */}
      <Stack
        sx={{
          gap: theme.gap(12),
          alignItems: "center",
          width: "80%",
          [theme.breakpoints.down("lg")]: { width: "100%" },
          background: theme.palette.gray.trans[1],
          borderRadius: theme.radius[3],
        }}
      >
        {isLoadingSetup ? (
          <Box sx={{ padding: theme.boxSpacing(12) }}>
            <ProgressIcon
              options={{ size: 24 }}
              label={translateTxtString(AUTH_FEEDBACK.loading_auth_data)}
            />
          </Box>
        ) : (
          <>
            {/* Render scanned QR Code canvas once backend payload is fetched */}
            {!isSetupError &&
            (setupData?.qrCodeDataUrl || setupData?.manualEntryKey) ? (
              <>
                {setupData?.qrCodeDataUrl && (
                  <Box
                    component="img"
                    src={setupData.qrCodeDataUrl}
                    alt="Authenticator QR Code"
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: theme.radius[2],
                      border: `1px solid ${theme.palette.gray[100]}`,
                      padding: theme.boxSpacing(4),
                    }}
                  />
                )}
                {/* Fallback entry option for manual key entry */}
                {setupData?.manualEntryKey && (
                  <Stack
                    sx={{
                      alignItems: "center",
                      gap: theme.gap(2),
                      width: "100%",
                    }}
                  >
                    <TransText
                      {...AUTH_FEEDBACK.enter_code_manually}
                      style={{
                        ...theme.typography.text3,
                        color: theme.palette.gray[200],
                        textAlign: "center",
                      }}
                    />
                    <AppButton
                      variant="text"
                      size="small"
                      onClick={handleCopyKey}
                      style={{ color: theme.palette.primary.dark }}
                    >
                      {copied ? "Copied!" : setupData.manualEntryKey}
                    </AppButton>
                  </Stack>
                )}

                <AppButton
                  variant="contained"
                  onClick={proceedToVerification}
                  style={{ width: "100%" }}
                  options={{ disabled: isLoadingSetup }}
                >
                  <TransText
                    {...AUTH_BUTTON_LABELS.create_account}
                    noComponent
                  />
                </AppButton>
              </>
            ) : (
              // Render runtime error response messages
              <DisplayFeedbackUI
                type="NETWORK_GLITCH"
                headline={translateTxtString(
                  AUTH_FEEDBACK.failed_to_load_auth_data,
                )}
                tagline={inlineMsg}
                primaryCta={{
                  label: translateTxtString(COMMON_BUTTON_LABELS.retry),
                  variant: "outlined",
                  action: () => {
                    fetchSetup();
                  },
                }}
                icon={<SquaresExclude />}
                style={{
                  container: {
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                  },
                }}
              />
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
};
