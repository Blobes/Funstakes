"use client";

import React, { useRef, forwardRef, useCallback } from "react";
import {
  useMove,
  VisuallyHidden,
  useOverlay,
  FocusScope,
  usePreventScroll,
} from "react-aria";
import { Box, SxProps } from "@mui/material";
import { Theme } from "@mui/material/styles";

export type A11yUseCase =
  | "text-live" // WCAG 4.1.3: Status Messages
  | "dialog" // WCAG 2.4.3: Focus Order / 2.1.1 Keyboard
  | "carousel-track" // WCAG 2.1.1: Keyboard swipe handlers
  | "interactive" // WCAG 2.4.7: Focus Visible
  | "hidden-label"; // WCAG 1.3.1: Screen reader contextual explanations

interface A11yProps {
  useCase: A11yUseCase;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  label?: string;
  onSwipeNext?: () => void;
  onSwipePrev?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  sx?: SxProps<Theme>;
}

/**
 * Centrally attaches WCAG semantic attributes, roles, and focus traps to existing components without adding layout styles.
 */
export const A11y = forwardRef<HTMLDivElement, A11yProps>( // Wrap component with forwardRef
  (
    {
      useCase,
      children,
      isOpen = false,
      onClose,
      label,
      onSwipeNext,
      onSwipePrev,
      onClick,
      sx,
    },
    forwardedRef, // The ref passed from the parent component
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);

    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;

        // Update the forwarded ref (handle function or object refs)
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.RefObject<HTMLDivElement | null>).current =
            node;
        }
      },
      [forwardedRef],
    );

    const { overlayProps } = useOverlay(
      { isOpen, onClose, isDismissable: true },
      useCase === "dialog" ? internalRef : { current: null },
    );
    usePreventScroll({ isDisabled: useCase !== "dialog" || !isOpen });

    // Custom key interaction abstractions for carousels (WCAG 2.1.1)
    const { moveProps } = useMove({
      onMove: (e) => {
        if (useCase !== "carousel-track") return;
        if (e.pointerType === "keyboard") {
          if (e.deltaX > 0 && onSwipeNext) onSwipeNext();
          if (e.deltaX < 0 && onSwipePrev) onSwipePrev();
        }
      },
    });

    switch (useCase) {
      case "dialog":
        return (
          <FocusScope contain restoreFocus autoFocus>
            <Box
              {...overlayProps}
              ref={combinedRef}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              onClick={onClick}
              sx={{ display: "flex", ...sx }}
            >
              {children}
            </Box>
          </FocusScope>
        );

      case "text-live":
        return (
          <Box
            ref={combinedRef}
            aria-live="polite"
            aria-atomic="true"
            onClick={onClick}
            sx={{ display: "contents", ...sx }}
          >
            {children}
          </Box>
        );

      case "carousel-track":
        return (
          <Box
            {...moveProps}
            ref={combinedRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={label ?? "Slider track"}
            tabIndex={0}
            onClick={onClick}
            sx={{ display: "contents", ...sx }}
          >
            {children}
          </Box>
        );

      case "interactive":
        return (
          <Box
            component="span"
            ref={combinedRef}
            onClick={onClick}
            sx={{
              display: "contents",
              "& *:focus-visible": {
                outline: "2px solid var(--mui-palette-primary-main) !important",
                outlineOffset: "3px !important",
                boxShadow: "0 0 0 4px var(--mui-fixedColors-pTrans) !important",
              },
              ...sx,
            }}
          >
            {children}
          </Box>
        );

      case "hidden-label":
        return <VisuallyHidden>{children}</VisuallyHidden>;

      default:
        return <>{children}</>;
    }
  },
);
A11y.displayName = "A11y";
