"use client";

import React, { forwardRef } from "react";
import { IconButton, Stack } from "@mui/material";
import { ModalProps, OverlayRef } from "@repo/core";
import { Transition } from "./Transition";
import { scrollBarStyle } from "@repo/helpers";
import { X } from "lucide-react";
import { A11y } from "./A11y";
import { useUnifiedOverlay } from "@repo/shared-hooks";

/**
 * Displays modal overlay windows with configurable transitions and focus management.
 */
export const Modal = forwardRef<OverlayRef, ModalProps>(
  (
    {
      header,
      content,
      transition,
      canBeClosed = true,
      showHeader = true,
      onClose,
      style,
    },
    ref,
  ) => {
    const {
      isOpen,
      shouldRemove,
      containerRef,
      closeRef,
      handleClose,
      handleExited,
      theme,
    } = useUnifiedOverlay({
      type: "MODAL",
      ref,
      canClose: canBeClosed,
      onClose,
    });

    const transType = transition?.type || "zoom";
    const transDir = transition?.direction || "left";

    return (
      <Stack
        ref={containerRef}
        {...(canBeClosed ? { onClick: handleClose } : {})}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1000,
          visibility: !shouldRemove ? "visible" : "hidden",
          transition: "opacity 0.3s ease-in-out, visibility 0.3s",
          opacity: isOpen ? 1 : 0,
          backgroundColor: theme.palette.gray.trans.overlay(0.6),
          backdropFilter: `blur(12px)`,
          marginLeft: "0!important",
          padding: theme.boxSpacing(12),
          alignItems:
            transType === "slide"
              ? transDir === "right"
                ? "flex-start"
                : transDir === "left"
                  ? "flex-end"
                  : "center"
              : "center",
          justifyContent:
            transType === "slide"
              ? transDir === "down"
                ? "flex-start"
                : transDir === "up"
                  ? "flex-end"
                  : "center"
              : "center",
          ...style?.base?.overlay,

          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(4, 2),
            ...style?.smallScreen?.overlay,
          },
        }}
      >
        <Transition
          show={isOpen}
          timeout={200}
          type={transType}
          direction={transDir}
          onExited={handleExited}
        >
          <A11y
            useCase="dialog"
            isOpen={isOpen}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onClose={() => {
              handleClose({} as React.MouseEvent);
            }}
            label={
              typeof header === "string" ? header : "Modal Dialog View Window"
            }
            sx={{
              flexDirection: "column",
              maxHeight: "100%",
              gap: theme.gap(0),
              backgroundColor: theme.palette.gray[0],
              borderRadius: theme.radius[3],
              overflow: "hidden",
              width: style?.base?.content?.width ?? "40%",
              maxWidth: style?.base?.content?.maxWidth ?? "400px",
              touchAction: "none",
              ...style?.base?.content,

              [theme.breakpoints.down("md")]: {
                width: "60%",
                maxWidth: "350px",
              },
              [theme.breakpoints.down("sm")]: {
                width: style?.smallScreen?.content?.width ?? "89%",
                maxWidth: style?.smallScreen?.content?.maxWidth ?? "100%",
                ...style?.smallScreen?.content,
              },
            }}
          >
            {/* Header */}
            {showHeader && (header || canBeClosed) && (
              <Stack
                direction={"row"}
                sx={{
                  width: "100%",
                  position: "sticky",
                  touchAction: "none",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: theme.gap(2),
                  padding: theme.boxSpacing(2),
                  ...style?.header,
                  borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                }}
              >
                {header && header}
                {canBeClosed && (
                  <IconButton
                    aria-label="Close modal window context"
                    aria-controls="close-modal"
                    aria-haspopup="true"
                    ref={closeRef}
                    onClick={handleClose}
                  >
                    <X size={22} />
                  </IconButton>
                )}
              </Stack>
            )}

            {/* Content */}
            <Stack
              sx={{
                height: "100%",
                overflowY: "auto",
                padding: theme.boxSpacing(10),
                [theme.breakpoints.up("md")]: {
                  padding: theme.boxSpacing(14),
                },
                gap: theme.gap(8),
                ...(scrollBarStyle(theme) as any),
              }}
            >
              {content}
            </Stack>
          </A11y>
        </Transition>
      </Stack>
    );
  },
);
Modal.displayName = "Modal";
