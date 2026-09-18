"use client";

import React from "react";
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
export interface SplashUIProps {
  duration?: number;
}

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
  const theme = useTheme();

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(12),
      }}
    >
      <AppLogo size={44} />
      <ProgressIcon
        type="linear"
        options={{
          variant: "indeterminate",
        }}
        style={{
          width: 50,
          height: 5,
        }}
      />
      {/* <SVGWrapper src={asset.LoadingAnimation} size={46} preserveColor /> */}
    </RootUIContainer>
  );
};

/**
 * Renders the application splash screen with a linear progress bar driving towards completion.
 */
export const SplashUI = () => {
  const theme = useTheme();

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(10),
      }}
    >
      <AppLogo withName size={170} />
      <ProgressIcon
        type="linear"
        //  value={progress}
        options={{
          variant: "indeterminate",
        }}
        style={{
          width: 170,
          height: 3,
        }}
      />
    </RootUIContainer>
  );
};
