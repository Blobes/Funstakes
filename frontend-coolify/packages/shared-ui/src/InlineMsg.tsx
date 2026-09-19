"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton } from "@mui/material";
import { AlertCircle, X } from "lucide-react";
import { TransText } from "./Text";

interface MsgProps {
  msg: React.ReactNode;
  type?: "SUCCESS" | "ERROR";
  scrollIntoView?: boolean;
  showClose?: boolean;
  onClose?: () => void;
}

/**
 * Displays contextual inline state messages with structured severity styling and optional dismissal control.
 */
export const InlineMsgUI: React.FC<MsgProps> = ({
  msg,
  type = "ERROR",
  scrollIntoView = false,
  showClose = true,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync internal visibility state whenever a new message prop is passed
  useEffect(() => {
    setIsVisible(true);
  }, [msg]);

  // Monitor store messages to trigger viewport positioning recalculations
  useEffect(() => {
    if (scrollIntoView && isVisible && msg) {
      scrollRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [scrollIntoView, isVisible, msg]);

  /**
   * Dismisses the inline message interface and executes external callback if available.
   */
  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!msg || !isVisible) return null;

  return (
    <TransText
      component="div"
      isLiveAlert
      ref={scrollRef}
      sx={{
        ...theme.typography.text4,
        width: "100%",
        padding: theme.boxSpacing(4, 5),
        borderRadius: theme.radius[3],
        border: `1px solid ${type === "SUCCESS" ? theme.palette.gray.trans[1] : theme.palette.error.trans[1]}`,
        scrollMarginTop: theme.gap(70),
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.gap(6),
        color:
          type === "SUCCESS"
            ? theme.palette.gray[300]
            : theme.palette.error.dark,
        backgroundColor:
          type === "SUCCESS"
            ? theme.palette.info.main
            : theme.palette.error.trans[1],
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: theme.gap(6),
          flex: 1,
        }}
      >
        <AlertCircle
          size={20}
          style={{
            flexShrink: 0,
            stroke:
              type === "SUCCESS"
                ? theme.palette.primary.main
                : theme.palette.error.dark,
          }}
        />
        {msg}
      </Box>

      {showClose && (
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            padding: theme.boxSpacing(2),
            flexShrink: 0,
            "& svg": {
              stroke: theme.palette.error.dark,
            },
          }}
        >
          <X size={16} />
        </IconButton>
      )}
    </TransText>
  );
};
