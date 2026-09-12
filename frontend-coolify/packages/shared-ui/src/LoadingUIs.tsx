"use client";

import React, { useEffect, useState } from "react";
import {
  CircularProgress,
  LinearProgress,
  Box,
  CircularProgressProps,
  LinearProgressProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RootUIContainer } from "./Containers";
import { GenericStyle } from "@repo/core";
import { asset } from "@repo/assets";
import { SVGWrapper } from "./SvgWrapper";
import { TransText } from "./Text";
import { AppLogo } from "./AppLogo";

export interface BaseProgressProps {
  label?: React.ReactNode;
  value?: number;
  style?: GenericStyle;
}
export interface CircularProgressTypeProps extends BaseProgressProps {
  type?: "circular";
  options?: CircularProgressProps;
}
export interface LinearProgressTypeProps extends BaseProgressProps {
  type: "linear";
  options?: LinearProgressProps;
}
export type ProgressProps = CircularProgressTypeProps | LinearProgressTypeProps;

/**
 * Renders a standardized circular or linear loading indicator with dynamic typography support.
 */
export const ProgressIcon = (props: ProgressProps) => {
  const { label, value, type = "circular", style } = props;
  const theme = useTheme();

  const renderProgress = () => {
    if (props.type === "linear") {
      const { options } = props;
      const linearVariant = options?.variant ?? "indeterminate";

      return (
        <LinearProgress
          variant={linearVariant}
          value={value}
          sx={{
            width: "100%",
            color: theme.fixedColors.primary,
            backgroundColor: theme.palette.gray.trans[1],
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.fixedColors.primary,
            },
            borderRadius: theme.radius.full,
            ...style,
          }}
          {...options}
          aria-label="Loading…"
        />
      );
    }
    const { options } = props;
    const circularVariant = options?.variant ?? "indeterminate";

    return (
      <CircularProgress
        enableTrackSlot
        variant={circularVariant}
        value={value}
        sx={{ color: theme.fixedColors.primary, ...style }}
        {...options}
        thickness={2.5}
        aria-label="Loading…"
      />
    );
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.gap(6),
        width: type === "linear" ? "100%" : "auto",
      }}
    >
      {renderProgress()}
      {label && (
        <TransText
          sx={{
            ...theme.typography.text4,
            textAlign: "center",
            fontWeight: "500",
            fontStyle: "italic",
          }}
        >
          {label}
        </TransText>
      )}
    </Box>
  );
};

/**
 * Renders page navigation loading animation.
 */
export const PageLoaderUI = () => {
  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SVGWrapper src={asset.LoadingAnimation} size={46} preserveColor />
    </RootUIContainer>
  );
};

export interface SplashUIProps {
  duration?: number;
}
/**
 * Renders the application splash screen with a linear progress bar driving towards completion.
 */
export const SplashUI = ({ duration = 2500 }: SplashUIProps) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);

  // Animates the linear progress bar continuously over the specified duration.
  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const updateProgress = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const calculatedProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(calculatedProgress);
      if (elapsedTime < duration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };
    animationFrameId = requestAnimationFrame(updateProgress);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration]);

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(10),
      }}
    >
      <AppLogo withName size={200} />
      <ProgressIcon
        type="linear"
        value={progress}
        options={{
          variant: "determinate",
        }}
        style={{
          width: 200,
        }}
      />
    </RootUIContainer>
  );
};
