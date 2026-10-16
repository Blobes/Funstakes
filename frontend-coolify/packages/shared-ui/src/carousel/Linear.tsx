"use client";

import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CarouselArrows, CarouselDots } from "./Controls";
import { BaseStyleProps } from "@repo/core";
import { useLinearCarousel } from "@repo/shared-hooks";

// export interface CarouselStyle {
//   container?: BaseStyleObj;
//   viewport?: BaseStyleObj;
//   item?: Base;
//   arrowLeft?: BaseStyleObj;
//   arrowRight?: BaseStyleObj;
// }

export interface CarouselProps {
  items: React.ReactNode[];
  style?: BaseStyleProps;
  showArrows?: boolean;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  interval?: number;
  setCurrentIndex?: (index: number) => void;
  initialIndex?: number;
  isMultiView?: boolean;
}

/**
 * Single-view presentation layer driven entirely by native CSS horizontal scroll snapping.
 */
export const LinearCarousel = ({
  items,
  style,
  showArrows = true,
  autoPlay = false,
  pauseOnHover = true,
  interval = 5000,
  setCurrentIndex,
  initialIndex = 0,
  isMultiView = true,
}: CarouselProps) => {
  const theme = useTheme();

  const {
    currentIndex,
    viewportRef,
    isPaused,
    next,
    prev,
    goTo,
    handleScroll,
    setPauseState,
    isFirst,
    isLast,
  } = useLinearCarousel(
    items.length,
    interval,
    autoPlay,
    initialIndex,
    setCurrentIndex,
  );

  if (!items.length) return null;

  return (
    <Box
      onMouseEnter={() => pauseOnHover && setPauseState(true)}
      onMouseLeave={() => setPauseState(false)}
      onTouchStart={() => pauseOnHover && setPauseState(true)}
      onTouchEnd={() => setPauseState(false)}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        gap: theme.gap(5),
        flex: "none",
        userSelect: "none",
        ...style?.itemWrapper,
      }}
    >
      <Box
        ref={viewportRef}
        onScroll={handleScroll}
        sx={{
          position: "relative",
          display: "flex",
          width: "100%",
          flex: "1 1 0%",
          minHeight: "fit-content",
          overflowX: "auto",
          overflowY: "hidden",
          gap: theme.gap(4),
          paddingX: isMultiView ? theme.gap(16) : 0,
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          ...style?.viewport,
        }}
      >
        {items.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              width: isMultiView ? "96%" : "100%",
              height: "100%",
              flexShrink: 0,
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              [theme.breakpoints.between("sm", "md")]: {
                width: "70%",
              },
              ...style?.item,
            }}
          >
            {item}
          </Box>
        ))}
      </Box>

      {showArrows && items.length > 1 && (
        <CarouselArrows
          onPrev={prev}
          onNext={next}
          disableLeft={isFirst}
          disableRight={isLast}
          style={{
            arrowLeft: style?.arrowLeft,
            arrowRight: style?.arrowRight,
          }}
        />
      )}

      {items.length > 1 && (
        <CarouselDots
          length={items.length}
          current={currentIndex}
          onGoTo={goTo}
          interval={interval}
          autoPlay={autoPlay && !isPaused}
        />
      )}
    </Box>
  );
};
