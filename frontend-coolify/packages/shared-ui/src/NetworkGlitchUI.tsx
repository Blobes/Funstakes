"use client";

import React, { useEffect } from "react";
import { useTheme } from "@mui/material";
import { DisplayFeedbackUI } from "./Feedback";
import { ProgressIcon } from "./LoadingUIs";
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
    const refreshTimer = window.setTimeout(() => {
      window.location.reload();
    }, AUTO_REFRESH_MS);

    return () => window.clearTimeout(refreshTimer);
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
        <ProgressIcon
          label={translateTxtString(COMMON_FEEDBACK.retrieving_connection)}
          options={{ size: 30 }}
        />
      ) : (
        <DisplayFeedbackUI
          type={isServerError ? "SERVER_ERROR" : "NETWORK_GLITCH"}
          icon={
            <SVGWrapper
              src={
                isServerError ? asset.NotFoundAnimation : asset.networkGlitch
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
