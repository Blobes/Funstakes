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
  style?: { container?: GenericStyle; element?: GenericStyle };
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
            color: theme.fixedColors.primary,
            backgroundColor: theme.palette.gray.trans[1],
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.fixedColors.primary,
            },
            ...style?.element,
          }}
          {...(options as LinearProgressProps)}
          aria-label="Loading…"
        />
      );
    }

    //  const circularVariant = options?.variant ?? "indeterminate";

    return (
      <CircularProgress
        enableTrackSlot
        variant={variant as "determinate" | "indeterminate"}
        value={value}
        sx={{ color: theme.fixedColors.primary, ...style?.element }}
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
        ...style?.container,
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
      <ProgressUI
        type="linear"
        options={{
          variant: "indeterminate",
        }}
        style={{
          container: {
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
      <AppLogo withName size={170} />
      <ProgressUI
        type="linear"
        options={{
          variant: "indeterminate",
        }}
        style={{
          element: {
            width: 170,
            height: 3,
          },
        }}
      />
    </RootUIContainer>
  );
};
