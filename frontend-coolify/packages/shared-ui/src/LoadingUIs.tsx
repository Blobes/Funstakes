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
import { BaseStyleProps } from "@repo/core";
import { TransText } from "./Text";
import { AppLogo } from "./AppLogo";

export interface BaseProgressProps {
  label?: React.ReactNode;
  value?: number;
  style?: BaseStyleProps;
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
export const ProgressUI = (props: ProgressProps) => {
  const { label, value, type = "circular", style, options } = props;
  const theme = useTheme();
  const variant = options?.variant ?? "indeterminate";

  const renderProgress = () => {
    if (type === "linear") {
      //  const linearVariant = options?.variant ?? "indeterminate";

      return (
        <LinearProgress
          variant={variant}
          value={value}
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: theme.palette.gray.trans[1],
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.palette.primary.main,
            },
            ...style?.tracker,
          }}
          {...(options as LinearProgressProps)}
          aria-label="Loading…"
        />
      );
    }

    return (
      <CircularProgress
        enableTrackSlot
        variant={variant as "determinate" | "indeterminate"}
        value={value}
        sx={{ color: theme.fixedColors.primary, ...style?.tracker }}
        thickness={2.5}
        aria-label="Loading…"
        {...(options as CircularProgressProps)}
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
        zIndex: 10,
        background: theme.palette.gray.trans[1],
        borderRadius: theme.radius.full,
        overflow: "hidden",
        ...style?.itemWrapper,
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
        gap: theme.gap(18),
      }}
    >
      <AppLogo size={40} linkable={false} />
      <ProgressUI
        type="linear"
        options={{
          variant: "indeterminate",
        }}
        style={{
          itemWrapper: {
            width: 50,
            height: 5,
          },
        }}
      />
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
      <AppLogo withName size={200} linkable={false} />
      <ProgressUI
        type="linear"
        options={{ variant: "indeterminate" }}
        style={{
          tracker: {
            width: 200,
            height: 4,
          },
        }}
      />
    </RootUIContainer>
  );
};
