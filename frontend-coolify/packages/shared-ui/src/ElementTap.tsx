"use client";

import React, { useState, useCallback, useRef } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { Heart } from "lucide-react";
import { heartPop, vibrate } from "@repo/helpers";
import { GenericStyle } from "@repo/core";

interface ElementTapProps {
  children: React.ReactNode;
  onSingleTap: () => void;
  onDoubleTap: () => void;
  iconSize?: number;
  style?: GenericStyle;
}

export const ElementTap = ({
  children,
  onDoubleTap,
  onSingleTap,
  iconSize = 70,
  style,
}: ElementTapProps) => {
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track movement to distinguish Tap vs. Scroll
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isMovement = useRef(false);

  const shouldIgnoreTarget = (target: EventTarget | null) => {
    return target instanceof Element && !!target.closest("[data-no-doubletap]");
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (shouldIgnoreTarget(e.target)) return;
    touchStartPos.current = { x: e.clientX, y: e.clientY };
    isMovement.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dist = Math.hypot(
      e.clientX - touchStartPos.current.x,
      e.clientY - touchStartPos.current.y,
    );
    // If moved more than 10px, consider it a scroll/drag
    if (dist > 10) isMovement.current = true;
  };

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (shouldIgnoreTarget(e.target)) return;
      e.stopPropagation();

      // 1. If the finger moved, it's a scroll—ABORT
      if (isMovement.current) {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        return;
      }

      const now = Date.now();
      const DOUBLE_TAP_DELAY = 250; // 300ms is standard social media timing

      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        // --- DOUBLE TAP DETECTED ---
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }

        vibrate();
        setShowHeart(false);
        setTimeout(() => setShowHeart(true), 10);

        // Trigger like
        onDoubleTap();

        setTimeout(() => setShowHeart(false), 1100);
        lastTap.current = 0;
      } else {
        // --- POTENTIAL SINGLE TAP ---
        lastTap.current = now;

        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() => {
          onSingleTap();
          timer.current = null;
          lastTap.current = 0; // Important: Clear lastTap if single tap confirms
        }, DOUBLE_TAP_DELAY);
      }
    },
    [onDoubleTap, onSingleTap],
  );

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        touchAction: "pan-y",
        ...style,
      }}
    >
      {showHeart && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            pointerEvents: "none",
            animation: `${heartPop} 1.2s linear alternate`,
            zIndex: 5,
          }}
        >
          <Heart
            size={iconSize}
            style={{
              filter: "drop-shadow(0px 0px 10px rgba(0,0,0,0.3))",
              fill: "white",
              stroke: "white",
            }}
          />
        </Box>
      )}
      {children}
    </Box>
  );
};

export interface DisabledClickWrapperProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: GenericStyle;
}
/**
 * Wraps disabled UI elements to capture click events despite native browser event suppression.
 */
export const DisabledClickWrapper: React.FC<DisabledClickWrapperProps> = ({
  children,
  onClick,
  style,
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: "100%",
        pointerEvents: "auto",
        cursor: "not-allowed",
        "& > *": {
          pointerEvents: "none",
        },
        ...style,
      }}
    >
      {children}
    </Box>
  );
};
