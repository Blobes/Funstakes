"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { IconButton, Stack } from "@mui/material";
import {
  useBotVerification,
  useCachedData,
  useMisc,
  useStaticTranslation,
} from "@repo/shared-hooks";
import {
  AUTH_FEEDBACK,
  COMMON_BUTTON_LABELS,
  IStep,
  OtpStepName,
  OtpTransitData,
  STORAGE_KEYS,
  TransitPurpose,
} from "@repo/core";
import {
  DisplayFeedbackUI,
  ProgressIcon,
  Stepper,
  BotVerification,
  AppLogo,
  BasicTooltip,
} from "@repo/shared-ui";
import { useLogout, usePopup, VerifyIdentity } from "@repo/features";
import { ArrowLeft } from "lucide-react";
import { VerifyIdentityPreview } from "./Preview";

/**
 * Manages two-factor/OTP verification workflow, protected by bot challenge verification steps.
 */
export default function VerificationPage() {
  const theme = useTheme();
  const transitEntries = useCachedData<OtpTransitData<TransitPurpose>>(
    STORAGE_KEYS.TRANSIT_DATA,
  );
  const { translateTxtString } = useStaticTranslation();
  const { handleLogout } = useLogout();
  const { openPopup } = usePopup();
  const { isMobile } = useMisc();

  const [shouldRestrict, setShouldRestrict] = useState<boolean>(false);
  const [currStep, setCurrStep] = useState<OtpStepName>("BOT_CHALLENGE");

  const { isCheckingSession, triggerBotChallenge, isBotChallengeAllowed } =
    useBotVerification({
      currStep,
      setCurrStep,
    });

  const steps = useMemo<IStep<OtpStepName>[]>(
    () => [
      {
        name: "BOT_CHALLENGE",
        element: (
          <BotVerification currStep={currStep} setCurrStep={setCurrStep} />
        ),
      },
      {
        name: "VERIFY_IDENTITY",
        element: (
          // <VerifyIdentity
          //   transitData={transitEntries}
          //   setShouldRestrict={setShouldRestrict}
          //   onRateLimitExceeded={triggerBotChallenge}
          //   isBotChallengeAllowed={isBotChallengeAllowed}
          // />
          <VerifyIdentityPreview />
        ),
      },
    ],
    [
      currStep,
      setCurrStep,
      transitEntries,
      setShouldRestrict,
      triggerBotChallenge,
      isBotChallengeAllowed,
    ],
  );

  if (isCheckingSession) {
    return (
      <Stack
        sx={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProgressIcon options={{ size: 32 }} />
      </Stack>
    );
  }

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(40, 15),
        minHeight: "fit-content",
      }}
    >
      {(transitEntries && transitEntries.length > 0) || !shouldRestrict ? (
        <>
          {/* App Logo & Back Button */}
          <Stack
            sx={{
              flexDirection: "row",
              gap: theme.gap(12),
              position: "fixed",
              top: 20,
              left: 30,
              zIndex: 20,
              backgroundColor: theme.palette.gray[0],
              padding: theme.boxSpacing(4),
              borderRadius: theme.radius.full,
              [theme.breakpoints.down("md")]: {
                gap: theme.gap(4),
                top: 6,
                left: 6,
              },
            }}
          >
            <BasicTooltip
              title={translateTxtString(
                AUTH_FEEDBACK.terminate_session_back_to_login,
              )}
            >
              <IconButton
                aria-label="Open modal window context"
                aria-controls="open-modal"
                aria-haspopup="false"
                sx={{
                  width: 40,
                  height: 40,
                  padding: theme.boxSpacing(4, 4),
                  color: theme.palette.gray[300],
                  flex: "none",
                  "& svg": {
                    stroke: theme.palette.gray[300],
                  },
                  [theme.breakpoints.down("md")]: {
                    width: 36,
                    height: 36,
                  },
                }}
                onClick={() => {
                  openPopup("CONFIRM_SESSION_TERMINATION");
                }}
              >
                <ArrowLeft size={isMobile ? 22 : 26} />
              </IconButton>
            </BasicTooltip>
            <AppLogo size={isMobile ? 36 : 40} />
          </Stack>

          {/* Verification UI View */}
          <Stepper
            steps={steps}
            currStep={currStep}
            setCurrStep={setCurrStep}
          />
        </>
      ) : (
        <DisplayFeedbackUI
          type="UNAUTHORIZED"
          headline={translateTxtString(
            AUTH_FEEDBACK.no_verification_sesion_found,
          )}
          tagline={translateTxtString(AUTH_FEEDBACK.return_home)}
          primaryCta={{
            label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
            action: handleLogout,
          }}
        />
      )}
    </Stack>
  );
}
