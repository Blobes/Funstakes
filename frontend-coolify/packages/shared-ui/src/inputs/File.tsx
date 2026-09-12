"use client";

import React, { ChangeEvent } from "react";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import { FileUp } from "lucide-react";
import { COMMON_INPUT, ITranslation } from "@repo/core";
import { TransText } from "../Text";
import { useStaticTranslation } from "@repo/shared-hooks";
import { DisabledClickWrapper } from "../ElementTap";

export interface FileInputProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDisabledClick?: () => void;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  selectedCount?: number;
  placeholder?: string;
  required?: boolean;
}

/**
 * Reusable layout boundary wrapper managing system file selection triggers.
 */
export const FileInput = ({
  onChange,
  multiple = true,
  accept = "image/*,video/*",
  disabled = false,
  selectedCount = 0,
  placeholder,
  onDisabledClick,
  required,
}: FileInputProps) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const tPlaceholer =
    placeholder ??
    translateTxtString(COMMON_INPUT.placeholder.choose_media_file);

  const renderInputField = () => (
    <Box
      sx={{
        border: `1px dashed ${theme.palette.gray[100]}`,
        padding: theme.boxSpacing(8, 8),
        borderRadius: theme.radius[3],
        backgroundColor: theme.palette.gray[50],
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(4),
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box
        component="label"
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          width: "100%",
        }}
      >
        <FileUp
          size={20}
          style={{ marginRight: "8px", stroke: theme.palette.gray[200] }}
        />
        {selectedCount > 0 ? (
          <TransText
            {...COMMON_INPUT.placeholder.media_files_selected(selectedCount)}
            sx={{
              ...theme.typography.text3,
              color: theme.palette.gray[200],
              flexGrow: 1,
            }}
          />
        ) : (
          <TransText
            sx={{
              ...theme.typography.text3,
              color: theme.palette.gray[200],
              flexGrow: 1,
            }}
          >
            {tPlaceholer}
          </TransText>
        )}
        <input
          type="file"
          required={required}
          multiple={multiple}
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          style={{ display: "none" }}
        />
      </Box>
    </Box>
  );

  return disabled ? (
    <DisabledClickWrapper onClick={onDisabledClick}>
      {renderInputField()}
    </DisabledClickWrapper>
  ) : (
    renderInputField()
  );
};
