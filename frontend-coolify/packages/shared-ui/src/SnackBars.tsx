"use client";

import React, { useEffect, useState } from "react";
import { IconButton, Paper, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { ISnackBarMsgs } from "@repo/core";
import { AppButton } from "./Buttons";
import { Info, CircleCheck, CircleAlert, X } from "lucide-react";
import { GroupTransition, Transition } from "./Transition";
import { WordTrimmer } from "./WordTrimmer";
import { TransText } from "./Text";

interface SnackbarProps {
  snackBarMsg: ISnackBarMsgs;
  removeMessage: (id: string) => void;
  setSBTimer: () => void;
}

/**
 * Handles snackbar display with a stable initial width and smooth expansion.
 */
export const SnackBars = ({
  snackBarMsg,
  removeMessage,
  setSBTimer,
}: SnackbarProps) => {
  if (!snackBarMsg.messages || snackBarMsg.messages.length === 0) {
    return null;
  }
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setSBTimer();
  }, [snackBarMsg.messages, setSBTimer]);

  return (
    <Stack
      sx={{
        position: "fixed",
        width: "fit-content",
        ...(snackBarMsg.dir === "up" ? { bottom: "10px" } : { top: "10px" }),
        right: "10px",
        zIndex: 2000,
        gap: theme.gap(2),
        pointerEvents: "none",
        alignItems: "flex-end",
        [theme.breakpoints.down("sm")]: {
          width: "94%",
        },
      }}
    >
      <GroupTransition>
        {snackBarMsg.messages.map((msg) => {
          return (
            <Transition
              key={msg.id}
              type="slide"
              direction={snackBarMsg.dir}
              timeout={300}
            >
              <Paper
                variant="elevation"
                component={motion.div}
                sx={{
                  maxWidth: isExpanded ? "600px" : "500px",
                  [theme.breakpoints.down("sm")]: {
                    width: "100%",
                  },
                  pointerEvents: "auto",
                  padding: theme.boxSpacing(8),
                  display: "flex",
                  alignItems: isExpanded ? "flex-start" : "center",
                  flexDirection: "row",
                  color:
                    msg.msgStatus !== "ERROR"
                      ? theme.palette.gray[0]
                      : theme.palette.error.dark,
                  backgroundColor:
                    msg.msgStatus !== "ERROR"
                      ? theme.palette.info.main
                      : theme.palette.error.light,
                  border:
                    msg.msgStatus !== "ERROR"
                      ? "none"
                      : `1px solid ${theme.palette.error.trans[2]}`,
                  borderRadius: theme.radius[4],
                  overflow: "hidden",
                  gap: theme.gap(10),
                  "& svg": {
                    stroke:
                      msg.msgStatus !== "ERROR"
                        ? theme.palette.gray[0]
                        : theme.palette.error.dark,
                  },
                }}
              >
                {!isExpanded &&
                  (msg.icon ??
                    (msg.msgStatus === "SUCCESS" ? (
                      <CircleCheck size={24} />
                    ) : msg.msgStatus === "INFO" ? (
                      !msg.icon ? (
                        <Info size={24} />
                      ) : (
                        msg.icon
                      )
                    ) : (
                      <CircleAlert size={24} />
                    )))}

                <Stack
                  sx={{
                    gap: theme.gap(1),
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  {msg.headline && (
                    <TransText
                      sx={{ ...theme.typography.text3, fontWeight: 600 }}
                    >
                      {msg.headline}
                    </TransText>
                  )}

                  {msg.tagline && (
                    <WordTrimmer
                      text={msg.tagline}
                      wordLimit={8}
                      onToggleClick={() => setIsExpanded(!isExpanded)}
                      style={{
                        btn: {
                          "&:hover": {
                            color:
                              msg.msgStatus !== "ERROR"
                                ? theme.palette.primary.main
                                : theme.palette.error.main,
                          },
                        },
                      }}
                    >
                      {msg.cta && (
                        <AppButton
                          variant="text"
                          size="small"
                          onClick={msg.cta.action}
                          style={{
                            padding: 0,
                            borderRadius: 0,
                            minWidth: "unset",
                            alignSelf: "unset",
                            "&:hover": {
                              color: theme.palette.gray[0],
                              backgroundColor: "transparent",
                            },
                          }}
                        >
                          {msg.cta.label}
                        </AppButton>
                      )}
                    </WordTrimmer>
                  )}
                  {msg.customContent && msg.customContent}
                </Stack>

                {/* Close Icon */}
                {msg.hasClose && msg.id && (
                  <IconButton
                    onClick={() => removeMessage(msg.id!)}
                    sx={{
                      flexShrink: 0,
                      cursor: "pointer",
                      backgroundColor:
                        msg.msgStatus !== "ERROR"
                          ? theme.fixedColors.pTrans
                          : theme.palette.error.trans,
                      "&:hover": {
                        backgroundColor: theme.fixedColors.grayTrans(
                          0.08,
                          "dark",
                        ),
                      },
                    }}
                  >
                    <X
                      size={18}
                      style={{
                        stroke: theme.palette.gray[0],
                        strokeWidth: 2.5,
                      }}
                    />
                  </IconButton>
                )}
              </Paper>
            </Transition>
          );
        })}
      </GroupTransition>
    </Stack>
  );
};
