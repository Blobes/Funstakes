"use client";

import React, { useState, useRef } from "react";
import { useTheme, styled } from "@mui/material/styles";
import {
  Box,
  IconButton,
  TextareaAutosize,
  useMediaQuery,
} from "@mui/material";
import { Keyboard } from "lucide-react";
import { GenericStyle } from "@repo/core";
import { scrollBarStyle } from "@repo/helpers";
import { useVirtualKeyboard } from "@repo/shared-hooks";
import { InputEventHandlers, InputProps } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

interface TextAreaProps extends InputProps, InputEventHandlers {
  maxRows?: number;
  minRows?: number;
  maxLength?: number | null;
  style?: {
    default: GenericStyle;
    focused: GenericStyle;
    hover: GenericStyle;
  };
}
// TextArea Styled Input
const StyledTextarea = styled(TextareaAutosize, {
  shouldForwardProp: (prop) => prop !== "customStyle",
})<{ customStyle: TextAreaProps["style"]; label: TextAreaProps["label"] }>(({
  label,
  customStyle,
  theme,
}) => {
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const styles = {
    ...theme.typography.text3,
    width: "100%",
    padding: label ? theme.boxSpacing(10, 0, 2, 2) : theme.boxSpacing(3, 2, 2),
    boxSizing: "border-box",
    color: theme.palette.gray[300],
    backgroundColor: "unset",
    resize: "none",
    border: "none",
    ...scrollBarStyle(theme),
    ...customStyle?.default,
    "&:focus": {
      border: "none",
      outline: "none",
      ...customStyle?.focused,
    },
    "&:hover": {
      ...customStyle?.hover,
    },
  };
  return styles as any;
});

// TextArea Styled Label
const StyledLabel = styled("label")<{ shrink: boolean }>(
  ({ theme, shrink }) =>
    ({
      ...(shrink ? theme.typography.text6 : theme.typography.text2),
      position: "absolute",
      left: theme.boxSpacing(2),
      top: shrink ? theme.boxSpacing(1) : theme.boxSpacing(3),
      color: theme.palette.gray[200],
      transition: "all 0.2s ease",
      pointerEvents: "none",
      width: "100%",
      textWrap: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      padding: theme.boxSpacing(0),
    }) as any,
);

export const ResponsiveTextarea = ({
  style = { default: {}, focused: {}, hover: {} },
  maxRows = 4,
  minRows = 1,
  placeholder = "Type here...",
  label,
  value = "",
  maxLength = null,
  disabled = false,
  onChange,
  onFocus,
  onBlur,
  onDisabledClick,
}: TextAreaProps) => {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();

  const {
    showKeyboard,
    setShowKeyboard,
    shouldUseVKeyboard: isVirtualActive,
    registerAsActiveInput,
  } = useVirtualKeyboard(textareaRef, onChange);

  const shrink = focused || value.length > 0;

  const renderInputField = () => (
    <Box sx={{ position: "relative", width: "100%" }}>
      {label && (
        <StyledLabel htmlFor="textarea" shrink={shrink}>
          {label}
        </StyledLabel>
      )}
      {isVirtualActive && (
        <IconButton
          onClick={() => {
            registerAsActiveInput();
            setShowKeyboard(!showKeyboard);
          }}
          size="small"
          sx={{
            ...(isVirtualActive &&
              showKeyboard && {
                backgroundColor: theme.palette.gray.trans[1],
                "& svg": {
                  stroke: theme.palette.primary.dark,
                },
              }),
          }}
        >
          <Keyboard size={18} />
        </IconButton>
      )}

      <StyledTextarea
        ref={textareaRef}
        id="textarea"
        aria-label="Text area"
        customStyle={style}
        maxRows={maxRows}
        minRows={minRows}
        label={label}
        placeholder={label ? "" : placeholder}
        value={value}
        maxLength={maxLength ?? undefined}
        onChange={(e) => onChange && onChange(e)}
        onFocus={(e) => {
          setFocused(true);
          registerAsActiveInput();
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur && onBlur(e);
        }}
      />
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
