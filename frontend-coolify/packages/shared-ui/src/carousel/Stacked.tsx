"use client";

import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CarouselDots } from "./Controls";
import { CarouselProps } from "./Linear";
import { useStackedCarousel } from "@repo/shared-hooks";

/**
 * Presentation layer for a stacked card layout animated purely through CSS transitions.
 */
export const StackedCarousel = ({
  items,
  style,
  autoPlay = false,
  pauseOnHover = true,
  interval = 5000,
  setCurrentIndex,
}: CarouselProps) => {
  const theme = useTheme();

  const {
    currentIndex,
    visibleItems,
    isPaused,
    goTo,
    setPauseState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    getCardTransforms,
  } = useStackedCarousel(items.length, interval, autoPlay);

  React.useEffect(() => {
    setCurrentIndex?.(currentIndex);
  }, [currentIndex, setCurrentIndex]);

  if (!items.length) return null;

  return (
    <Box
      onMouseEnter={() => pauseOnHover && setPauseState(true)}
      onMouseLeave={() => setPauseState(false)}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        gap: theme.gap(8),
        flex: "none",
        userSelect: "none",
        ...style?.wrapper,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          flex: "1 1 0%",
          minHeight: 0,
          ...style?.viewport,
        }}
      >
        {visibleItems.map(({ itemIndex, depthIndex }) => {
          const isTopCard = depthIndex === 0;
          const transforms = getCardTransforms(depthIndex);

          return (
            <Box
              key={itemIndex}
              onPointerDown={isTopCard ? handlePointerDown : undefined}
              onPointerMove={isTopCard ? handlePointerMove : undefined}
              onPointerUp={isTopCard ? handlePointerUp : undefined}
              onPointerCancel={isTopCard ? handlePointerUp : undefined}
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "absolute",
                zIndex: transforms.zIndex,
                opacity: transforms.opacity,
                touchAction: transforms.touchAction,
                cursor: transforms.cursor,
                transform: transforms.dragTransform,
                transition: transforms.transition,
                transformOrigin: "bottom center",
                ...style?.item,
              }}
            >
              {items[itemIndex]}
            </Box>
          );
        })}
      </Box>

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
