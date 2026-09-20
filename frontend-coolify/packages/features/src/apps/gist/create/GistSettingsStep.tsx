"use client";

import React from "react";
import { Box, Checkbox, FormControlLabel, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton, InlineMsgUI, ProgressUI, TransText } from "@repo/shared-ui";
import {
  POST_BUTTON_LABELS,
  POST_FEEDBACK,
  POST_INPUT,
  PostStepName,
  StepperProps,
} from "@repo/core";

export interface SettingsStepProps extends StepperProps<PostStepName> {
  hasSensitiveGraphic?: boolean;
  setHasSensitiveGraphic?: (val: boolean) => void;
  isProcessing: boolean;
  inlineErrMsg: React.ReactNode | null;
  handleGistPublish: (e: React.SubmitEvent) => void;
}
/**
 * Standardized secondary configuration panel processing parameters and publishing actions.
 */
export const GistSettingsStep: React.FC<SettingsStepProps> = ({
  step,
  setStep,
  hasSensitiveGraphic,
  setHasSensitiveGraphic,
  isProcessing,
  inlineErrMsg,
  handleGistPublish,
}) => {
  const theme = useTheme();

  return (
    <Box
      component="form"
      onSubmit={handleGistPublish}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(7.5),
      }}
    >
      <Stack sx={{ gap: theme.gap(2) }}>
        <TransText
          {...POST_FEEDBACK.post_settings}
          sx={{ ...theme.typography.text1, color: theme.palette.gray[300] }}
        />
        {!isProcessing && inlineErrMsg && (
          <InlineMsgUI msg={inlineErrMsg} type="ERROR" />
        )}
      </Stack>

      <Stack sx={{ flexDirection: "row", gap: theme.gap(4), flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hasSensitiveGraphic}
              disabled={isProcessing}
              onChange={(e) => setHasSensitiveGraphic?.(e.target.checked)}
              sx={{
                color: theme.palette.gray[100],
                "&.Mui-checked": { color: theme.palette.error.main },
              }}
            />
          }
          label={
            <TransText
              {...POST_INPUT.label.flag_sensitive_graphics}
              sx={{ ...theme.typography.text3, color: theme.palette.gray[200] }}
            />
          }
        />
      </Stack>

      <Stack sx={{ flexDirection: "row", gap: theme.gap(4), width: "100%" }}>
        <AppButton
          variant="outlined"
          onClick={() => setStep?.("CONTENT")}
          options={{ disabled: isProcessing }}
          style={{ flex: 1 }}
        >
          <TransText {...POST_BUTTON_LABELS.post_back} noComponent />
        </AppButton>

        <AppButton
          variant="contained"
          submit
          options={{
            disabled: isProcessing,
          }}
          style={{
            flex: 2,
          }}
        >
          {isProcessing ? (
            <>
              <ProgressUI options={{ size: 20 }} />
              <TransText {...POST_BUTTON_LABELS.syncing_post} noComponent />
            </>
          ) : (
            <TransText {...POST_BUTTON_LABELS.post_submit} noComponent />
          )}
        </AppButton>
      </Stack>
    </Box>
  );
};
