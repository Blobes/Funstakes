"use client";

import React, { useId, useState, useRef, useLayoutEffect } from "react";
import { Stack, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { COMMON_BUTTON_LABELS, BaseStyleProps } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { TransText } from "./Text";
import { lineClamp } from "@repo/helpers";

interface WordTrimmerProps {
  text?: string;
  maxLines?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  children?: React.ReactNode;
  component?: React.ElementType;
  allowCollapse?: boolean;
  style?: BaseStyleProps;
  onTextClick?: () => void;
  onExpandedChange?: (isExpanded: boolean) => void;
}

/**
 * Collapses long text by visible line count. Whole block is clickable to toggle.
 */
export const WordTrimmer = ({
  children,
  text,
  maxLines = 3,
  component = "p",
  style,
  showMoreLabel,
  showLessLabel,
  allowCollapse = true,
  onTextClick,
  onExpandedChange,
}: WordTrimmerProps) => {
  const { translateTxtString } = useStaticTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTrimmable, setIsTrimmable] = useState(false);
  const theme = useTheme();
  const textContentId = useId();
  const textRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || !text) {
      setIsTrimmable(false);
      return;
    }

    const prevDisplay = el.style.display;
    const prevOverflow = el.style.overflow;
    const prevClamp = el.style.webkitLineClamp;

    el.style.display = "-webkit-box";
    el.style.setProperty("-webkit-box-orient", "vertical");
    el.style.overflow = "hidden";
    el.style.webkitLineClamp = String(maxLines);

    const overflows = el.scrollHeight > el.clientHeight + 1;
    setIsTrimmable(overflows);

    el.style.display = prevDisplay;
    el.style.overflow = prevOverflow;
    el.style.webkitLineClamp = prevClamp;
    el.style.removeProperty("-webkit-box-orient");
  }, [text, maxLines, style?.targetContent]);

  if (!text) return null;

  const canCollapse = allowCollapse && isExpanded;
  const canExpand = isTrimmable && !isExpanded;
  const isInteractive = canExpand || canCollapse;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTrimmable) return;
    if (isExpanded) {
      if (!allowCollapse) return;
      setIsExpanded(false);
      onExpandedChange?.(false);
      onTextClick?.();
      return;
    }
    setIsExpanded(true);
    onExpandedChange?.(true);
  };

  const activeLabel = isExpanded
    ? showLessLabel || translateTxtString(COMMON_BUTTON_LABELS.show_less)
    : showMoreLabel || translateTxtString(COMMON_BUTTON_LABELS.show_more);

  // Hide label when expanded and collapse is disabled
  const showLabel = isTrimmable && (allowCollapse || !isExpanded);

  const collapsedSx =
    !isExpanded && isTrimmable
      ? lineClamp(maxLines) // {
      : //     //   display: "-webkit-box",
        //   //  overflow: "hidden",
        //    // WebkitLineClamp: maxLines,
        //     ...lineClamp(maxLines),
        //     // ...({ WebkitBoxOrient: "vertical" } as React.CSSProperties),
        //   }
        {
          display: "block",
          overflow: "visible",
          WebkitLineClamp: "unset",
        };

  return (
    <Stack sx={{ width: "100%", alignItems: "flex-start", ...style?.wrapper }}>
      <Box
        onClick={isInteractive ? handleToggle : undefined}
        sx={{
          width: "100%",
          cursor: isInteractive ? "pointer" : "inherit",
          userSelect: isInteractive ? "none" : "auto",
        }}
        aria-expanded={isTrimmable ? isExpanded : undefined}
        aria-controls={isTrimmable ? textContentId : undefined}
      >
        <TransText
          ref={textRef}
          id={textContentId}
          component={component}
          sx={{
            ...theme.typography.text4,
            ...style?.targetContent,
            color: "inherit",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            ...collapsedSx,
          }}
        >
          {text}
        </TransText>

        {showLabel && (
          <TransText
            component="span"
            sx={{
              ...theme.typography.text4,
              display: "inline",
              textDecoration: "underline",
              color: "inherit",
              ...style?.label,
            }}
          >
            {activeLabel}
          </TransText>
        )}
      </Box>
      {children}
    </Stack>
  );
};
