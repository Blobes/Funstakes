"use client";

import { Stack } from "@mui/material";
import { COMMON_MEDIA, MediaProcessingProgress } from "@repo/core";
import { ProgressUI } from "../../LoadingUIs";
import { TransText } from "../../Text";
import { useTheme } from "@mui/material/styles";

interface UploadTrackerProps {
  uploadStates: Record<string, MediaProcessingProgress>;
}

/**
 * Renders real-time media upload metrics directly inside the shared snackbar container.
 */
export const MediaUploadTracker: React.FC<UploadTrackerProps> = ({
  uploadStates,
}) => {
  const theme = useTheme();
  return (
    <Stack sx={{ gap: "8px", minWidth: "240px" }}>
      {Object.entries(uploadStates).map(([trackingId, state]) => {
        const status = state.status;
        return (
          <Stack
            key={trackingId}
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <TransText
              {...(status === "UPLOADING"
                ? COMMON_MEDIA.uploading(state.fileName)
                : status === "SUCCESS"
                  ? COMMON_MEDIA.upload_success(state.fileName)
                  : COMMON_MEDIA.upload_error(
                      state.fileName,
                      state.error || "failed, something went wrong",
                    ))}
              sx={{ ...theme.typography.text4, color: "inherit" }}
            />
            <ProgressUI
              value={state.progress}
              options={{
                variant: "determinate",
                size: 24,
              }}
              style={{ container: { flexShrink: 0 } }}
            />
          </Stack>
        );
      })}
    </Stack>
  );
};
