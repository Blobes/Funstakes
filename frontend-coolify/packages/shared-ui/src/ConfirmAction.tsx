"use client";

import React, { ReactNode } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericStyle } from "@repo/core";
import { TransText } from "./Text";
import { AppButton } from "./Buttons";
import { ProgressIcon } from "./LoadingUIs";

export interface ActionConfirmationProps {
  icon?: ReactNode;
  headline: ReactNode;
  tagline?: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmBtnColorType?: "primary" | "success" | "error";
  isLoading?: boolean;
  style?: {
    icon?: GenericStyle;
    container?: GenericStyle;
    headline?: GenericStyle;
    tagline?: GenericStyle;
  };
}

/**
 * Reusable UI View for confirming user actions across the app.
 */
export const ConfirmAction: React.FC<ActionConfirmationProps> = ({
  icon,
  headline,
  tagline,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmBtnColorType = "primary",
  isLoading = false,
  style,
}) => {
  const theme = useTheme();

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
      return;
    }
  };
  const handleConfirmClick = async () => {
    await onConfirm();
  };

  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        ...style?.container,
      }}
    >
      {icon && icon}

      {typeof headline === "string" ? (
        <TransText
          component="h4"
          sx={{
            ...theme.typography.h4,
            textAlign: "center",
            ...style?.headline,
          }}
        >
          {headline}
        </TransText>
      ) : (
        headline
      )}

      {tagline &&
        (typeof tagline === "string" ? (
          <TransText
            component="p"
            sx={{
              ...theme.typography.body2,
              textAlign: "center",
              ...style?.tagline,
            }}
          >
            {tagline}
          </TransText>
        ) : (
          tagline
        ))}

      <Stack direction="row" sx={{ width: "100%", justifyContent: "center" }}>
        <AppButton variant="outlined" onClick={handleCancelClick}>
          {cancelLabel}
        </AppButton>

        <AppButton
          variant="contained"
          colorType={confirmBtnColorType}
          onClick={handleConfirmClick}
        >
          {isLoading ? <ProgressIcon options={{ size: 25 }} /> : confirmLabel}
        </AppButton>
      </Stack>
    </Stack>
  );
};
