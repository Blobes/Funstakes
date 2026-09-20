"use client";

import React from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import {
  AppButton,
  DynamicInput,
  ProgressUI,
  TransText,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { useIdentity } from "../hooks/useIdentity";
import { ChevronLeft } from "lucide-react";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  AuthStepName,
  COMMON_BUTTON_LABELS,
  StepperProps,
} from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";

/**
 * Step 1: Identity UI utilizing the bulk-validated hook.
 */
export const Identity: React.FC<StepperProps<AuthStepName>> = ({
  onNext,
  onPrev,
}) => {
  const theme = useTheme();
  const {
    formData,
    handleChange,
    submitIdentity,
    isPending,
    isFormValid,
    usernameStatus,
    setFormData,
  } = useIdentity(onNext);
  const { translateTxtString } = useStaticTranslation();

  return (
    <Stack sx={{ gap: theme.gap(18), width: "100%" }}>
      <Stack sx={{ textAlign: "center" }}>
        <TransText
          {...AUTH_FEEDBACK.confirm_identity}
          sx={theme.typography.h5}
        />
        <TransText
          {...AUTH_FEEDBACK.confirm_identity}
          sx={theme.typography.h5}
        />
        <TransText
          {...AUTH_FEEDBACK.setup_legal_names_username}
          sx={{ ...theme.typography.text3, color: theme.palette.gray[200] }}
        />
      </Stack>

      <Stack
        component="form"
        sx={{ gap: theme.gap(12) }}
        onSubmit={(e) => {
          e.preventDefault();
          submitIdentity();
        }}
      >
        <DynamicInput
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.enter_first_name,
          )}
          label={translateTxtString(AUTH_INPUT.label.first_name)}
          value={formData.firstName}
          onChange={handleChange}
        />

        <DynamicInput
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.enter_last_name,
          )}
          label={translateTxtString(AUTH_INPUT.label.last_name)}
          value={formData.lastName}
          onChange={handleChange}
        />

        <DynamicInput
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.create_username,
          )}
          label={translateTxtString(AUTH_INPUT.label.username)}
          value={formData.username}
          onChange={handleChange}
          error={usernameStatus.status === "TAKEN"}
          helperText={
            usernameStatus.status === "TAKEN" ? "Username already exists." : ""
          }
        />

        {usernameStatus.status === "TAKEN" && usernameStatus.suggestions && (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {usernameStatus.suggestions.map((sug) => (
              <TransText
                key={sug}
                onClick={() => setFormData({ ...formData, username: sug })}
                sx={{
                  ...theme.typography.text5,
                  cursor: "pointer",
                  color: theme.palette.primary.main,
                }}
              >
                {sug}
              </TransText>
            ))}
          </Stack>
        )}
        <Stack direction="row">
          {/* Navigate backward */}
          {/* <BasicTooltip title={"Previous"}>
            <IconButton
              sx={{
                padding: theme.boxSpacing(3, 4),
                color: theme.palette.gray[200],
                border: `1px solid ${theme.palette.gray.trans[1]}`,
                borderRadius: theme.radius[3],
                width: "48px",
                backgroundColor: theme.fixedColors.pTrans,
              }}
              onClick={() => {
                if (onPrev) onPrev();
              }}>
              <ChevronLeft
                style={{ width: "20px", stroke: theme.palette.gray[200] }}
              />
            </IconButton>
          </BasicTooltip> */}

          {/* Proceed to next */}
          <AppButton
            variant="contained"
            style={{
              width: "100%",
            }}
            submit
            options={{ disabled: !isFormValid || isPending }}
          >
            {isPending ? (
              <ProgressUI options={{ size: 24 }} />
            ) : (
              <TransText {...AUTH_BUTTON_LABELS.proceed} noComponent />
            )}
          </AppButton>
        </Stack>
      </Stack>
    </Stack>
  );
};
