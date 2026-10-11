"use client";

import React, { useCallback } from "react";
import { Divider, Stack, useTheme } from "@mui/material";
import { asset } from "@repo/assets";
import { AppButton, SVGWrapper, TransText } from "@repo/shared-ui";
import {
  AUTH_FEEDBACK,
  AuthStepName,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  StepperProps,
} from "@repo/core";
import { Logout } from "@repo/features";

/**
 * First step of onboarding providing context and a way to start the process.
 */
export const OnboardingIntro: React.FC<StepperProps<AuthStepName>> = ({
  onNext,
}) => {
  const theme = useTheme();

  // Memoize navigation to next step
  const handleStart = useCallback(() => {
    if (onNext) onNext();
  }, [onNext]);

  return (
    <Stack
      sx={{
        alignItems: "center",
        textAlign: "center",
        gap: theme.gap(20),
        width: "100%",
        maxWidth: "400px",
      }}
    >
      <Stack sx={{ alignItems: "center", gap: theme.gap(12) }}>
        <SVGWrapper
          src={asset.Illustration2}
          size={140}
          preserveColor={true}
          fallbackUIType="SKELETON"
          // sx={{
          //   [theme.breakpoints.down("md")]: {
          //     width: 28,
          //     height: 28,
          //   },
          // }}
        />

        <Stack sx={{ gap: theme.gap(4) }}>
          <TransText
            {...COMMON_FEEDBACK.welcome_aboard_headline}
            sx={{ ...theme.typography.h4 }}
          />
          <TransText
            {...COMMON_FEEDBACK.welcome_aboard_tagline}
            sx={{ ...theme.typography.text3, color: theme.palette.gray[200] }}
          />
        </Stack>
      </Stack>

      <AppButton
        variant="contained"
        onClick={handleStart}
        style={{
          width: "100%",
        }}
      >
        <TransText {...COMMON_BUTTON_LABELS.get_started} noComponent />
      </AppButton>

      {/* Footer */}
      <Divider sx={{ width: "100%" }} />
      <TransText
        {...AUTH_FEEDBACK.few_minutes_to_setup_account}
        sx={{ ...theme.typography.text5, color: theme.palette.gray[200] }}
      />
      <Logout
        style={{
          wrapper: {
            gap: theme.gap(4),
            hover: {
              "& svg": { stroke: theme.palette.primary.dark },
            },
          },
          label: {
            width: "fit-content",
            textAlign: "center",
            color: theme.palette.gray[200],
          },
          icon: { size: 18 },
        }}
      />
    </Stack>
  );
};
