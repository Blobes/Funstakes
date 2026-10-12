"use client";

import React, { useEffect } from "react";
import { useTheme } from "@mui/material";
import { DisplayFeedbackUI } from "./Feedback";
import { ProgressUI } from "./LoadingUIs";
import { RootUIContainer } from "./Containers";
import { COMMON_FEEDBACK } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { SVGWrapper } from "./SvgWrapper";
import { asset } from "@repo/assets";

interface Props {
  checkingSignal: boolean;
  isUnstableNetwork: boolean;
  isServerError?: boolean;
}

const AUTO_REFRESH_MS = 2 * 60 * 1000;

export const NetworkGlitchUI = ({
  checkingSignal,
  isUnstableNetwork,
  isServerError,
}: Props) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  useEffect(() => {
    let refreshTimer: number | null = null;

    const clearTimer = () => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    };
    const startTimer = () => {
      clearTimer();
      refreshTimer = window.setTimeout(() => {
        window.location.reload();
      }, AUTO_REFRESH_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startTimer();
      } else {
        clearTimer();
      }
    };

    if (document.visibilityState === "visible") startTimer();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(30),
      }}
    >
      {isUnstableNetwork && checkingSignal ? (
        <ProgressUI
          label={translateTxtString(COMMON_FEEDBACK.retrieving_connection)}
          options={{ size: 30 }}
        />
      ) : (
        <DisplayFeedbackUI
          type={isServerError ? "SERVER_ERROR" : "NETWORK_GLITCH"}
          icon={
            <SVGWrapper
              src={
                isServerError
                  ? asset.ServerErrorAnimation1
                  : asset.networkGlitch
              }
              size={130}
              color={theme.palette.gray[200]}
            />
          }
          style={{ icon: { size: "unset", svg: { stroke: "none" } } }}
        />
      )}
    </RootUIContainer>
  );
};
