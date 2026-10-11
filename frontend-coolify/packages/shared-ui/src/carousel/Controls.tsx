"use client";

import React from "react";
import { Box, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { BaseStyleObj, BaseStyleProps, IBGFadeSlideData } from "@repo/core";
import { TransText } from "../Text";

interface ArrowProps {
  onPrev: () => void;
  onNext: () => void;
  disableLeft?: boolean;
  disableRight?: boolean;
  style?: BaseStyleProps;
}
export const CarouselArrows = ({
  onPrev,
  onNext,
  disableLeft,
  disableRight,
  style,
}: ArrowProps) => {
  const theme = useTheme();

  const sharedStyle = {
    position: "absolute",
    bottom: "1.5%",
    zIndex: 10,
    backgroundColor: theme.fixedColors.grayTrans(0.5, "dark"),
    transition: "stroke 0.3s ease, background-color 0.3s ease",
    "& svg": {
      stroke: "#ffffff",
    },
    "&:hover": {
      opacity: 0.8,
      backgroundColor: theme.fixedColors.gray800,
      "& svg": {
        stroke: theme.fixedColors.gray50,
      },
    },
  };

  return (
    <>
      <IconButton
        data-no-doubletap
        onClick={() => {
          onPrev();
        }}
        disabled={disableLeft}
        sx={{
          ...sharedStyle,
          left: style?.arrowLeft?.left || 10,
          ...(style?.arrowLeft as any),
          [theme.breakpoints.down("sm")]: {
            ...(style?.arrowLeft?.smScreen as any),
          },
        }}
      >
        <ChevronLeft />
      </IconButton>
      <IconButton
        data-no-doubletap
        onClick={onNext}
        disabled={disableRight}
        sx={{
          ...sharedStyle,
          right: style?.arrowRight?.left || 10,
          ...(style?.arrowRight as any),
          [theme.breakpoints.down("sm")]: {
            ...(style?.arrowRight?.smScreen as any),
          },
        }}
      >
        <ChevronRight />
      </IconButton>
    </>
  );
};

interface DotProps {
  length: number;
  current: number;
  onGoTo: (i: number) => void;
  interval: number;
  autoPlay: boolean;
}
/**
 * Pagination tracking indicators with a sliding window layout for high slide counts.
 */
export const CarouselDots = ({
  length,
  current,
  onGoTo,
  interval,
  autoPlay,
}: DotProps) => {
  const theme = useTheme();
  const MAX_VISIBLE = 5;

  // Calculate sliding window boundaries
  let startIdx = 0;
  let endIdx = length - 1;

  if (length > MAX_VISIBLE) {
    const half = Math.floor(MAX_VISIBLE / 2);
    startIdx = current - half;
    endIdx = current + half;

    // Adjust if window overflows the left boundary
    if (startIdx < 0) {
      startIdx = 0;
      endIdx = MAX_VISIBLE - 1;
    }

    // Adjust if window overflows the right boundary
    if (endIdx >= length) {
      endIdx = length - 1;
      startIdx = length - MAX_VISIBLE;
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(2),
        py: theme.boxSpacing(2),
        overflow: "hidden",
        flex: "none",
      }}
    >
      {Array.from({ length }).map((_, i) => {
        const isActive = i === current;
        const isVisible = i >= startIdx && i <= endIdx;

        // Render nothing if item falls outside the extended boundary rules
        if (!isVisible) return null;

        // Determine edge indicators for mini scaling effects
        const isLeftEdge = i === startIdx && startIdx > 0;
        const isRightEdge = i === endIdx && endIdx < length - 1;

        let dotScale = 1;
        if (isLeftEdge || isRightEdge) {
          dotScale = 0.6; // Scale down edge indicators to match design
        }

        return (
          <Box
            key={i}
            onClick={() => onGoTo(i)}
            sx={{
              position: "relative",
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: theme.radius.full,
              cursor: "pointer",
              bgcolor: theme.fixedColors.grayTrans(0.4, "mixed"),
              "&:hover": {
                bgcolor: theme.fixedColors.grayTrans(0.8, "mixed"),
              },
              overflow: "hidden",
              transform: `scale(${dotScale})`,
              transition:
                "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease",
            }}
          >
            {isActive && (
              <Box
                component={motion.div}
                initial={{ width: autoPlay ? "0%" : "100%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: autoPlay ? interval / 1000 : 0,
                  ease: "linear",
                }}
                sx={{
                  position: "absolute",
                  height: "100%",
                  bgcolor: theme.palette.primary.light,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

interface NamedProgressBarProps {
  slides: IBGFadeSlideData[];
  current: number;
  onGoTo: (i: number) => void;
  interval: number;
  autoPlay: boolean;
  style?: BaseStyleObj;
}
/**
 * Renders textual slider indicators mapped with native underlying progress loading lines.
 */
export const NamedProgressBar = ({
  slides,
  current,
  onGoTo,
  interval,
  autoPlay,
  style,
}: NamedProgressBarProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "calc(90% - 96px)",
        maxWidth: "400px",
        gap: theme.gap(6),
        pointerEvents: "auto",
        zIndex: 5,
        ...style,
      }}
    >
      {slides.map((slide, i) => {
        const isActive = i === current;
        const slideId = slide.media._id || String(i);

        return (
          <Box
            key={slideId}
            onClick={() => onGoTo(i)}
            sx={{
              width: slide.name ? "fit-content" : "100%",
              // minWidth: 60,
              display: "flex",
              flexDirection: "column",
              gap: theme.gap(3),
              cursor: "pointer",
              position: "relative",
              padding: theme.boxSpacing(1, 3, 3, 3),
              borderRadius: theme.radius[8],
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {/* Uniquely scoped via distinct slide identifiers to prevent dictionary compilation collisions */}
            {slide.name && (
              <TransText
                sx={{
                  ...theme.typography.text6Caps,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                  transition: "color 0.3s ease",
                }}
              >
                {slide.name}
              </TransText>
            )}

            {/* Progress Container Track */}
            <Box
              sx={{
                width: "100%",
                height: 2,
                bgcolor: "rgba(255, 255, 255, 0.15)",
                position: "relative",
                borderRadius: theme.radius.full,
                overflow: "hidden",
              }}
            >
              {isActive && (
                <Box
                  component={motion.div}
                  initial={{ width: autoPlay ? "0%" : "100%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: autoPlay ? interval / 1000 : 0,
                    ease: "linear",
                  }}
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "100%",
                    bgcolor: "#ffffff",
                  }}
                />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
