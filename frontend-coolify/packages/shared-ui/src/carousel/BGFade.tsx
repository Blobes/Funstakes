"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BaseStyleProps, IBGFadeSlideData } from "@repo/core";
import { NamedProgressBar } from "./Controls";
import { TransText } from "../Text";
import { A11y } from "../A11y";
import { useBGFadeCarousel } from "@repo/shared-hooks";
import { VideoMedia } from "../media/view/VideoMedia";

interface BGFadeCarouselProps {
  slides: IBGFadeSlideData[];
  interval?: number;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  style?: BaseStyleProps;
  enableEdgeTap?: boolean;
  progressBarPosition?: "top" | "bottom";
  header?: React.ReactNode;
  enablePressToHide?: boolean;
  shouldResetOnEnd?: boolean;
  onSlideEnd?: () => void;
}

/**
 * Interface layout applying absolute asset opacity crossfades paired with text visibility shifts.
 */
export const BGFadeCarousel = ({
  slides,
  interval = 5000,
  autoPlay = false,
  pauseOnHover = true,
  style,
  enableEdgeTap = false,
  progressBarPosition = "bottom",
  header,
  enablePressToHide = false,
  shouldResetOnEnd = true,
  onSlideEnd,
}: BGFadeCarouselProps) => {
  const theme = useTheme();
  const itemsLength = slides.length;

  const {
    currentIndex,
    isPaused,
    isPressed,
    containerRef,
    next,
    prev,
    goTo,
    setPauseState,
    handleTapNavigation,
    handlePressStart,
    handlePressEnd,
    isLast,
  } = useBGFadeCarousel(
    itemsLength,
    interval,
    autoPlay,
    0,
    undefined,
    shouldResetOnEnd,
    onSlideEnd,
  );

  if (!itemsLength) return null;

  const isContentHidden = enablePressToHide && isPressed;

  // Progress tracks stop expanding animations if auto-resetting is disabled on the final slide
  const shouldAnimateProgress =
    autoPlay && !isPaused && !isPressed && !(isLast && !shouldResetOnEnd);

  const renderedProgressBar = (
    <NamedProgressBar
      slides={slides}
      current={currentIndex}
      onGoTo={goTo}
      interval={interval}
      autoPlay={shouldAnimateProgress}
      style={{
        width: "100%",
        zIndex: 10,
        opacity: isContentHidden ? 0 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    />
  );

  return (
    <A11y
      useCase="carousel-track"
      label="Background media spotlight carousel showcases"
      onSwipeNext={next}
      onSwipePrev={prev}
    >
      <Box
        ref={containerRef}
        onClick={(e) => handleTapNavigation(e, enableEdgeTap)}
        onMouseEnter={() => pauseOnHover && !isPressed && setPauseState(true)}
        onMouseLeave={() => handlePressEnd(enablePressToHide)}
        onTouchStart={() => handlePressStart(enablePressToHide, pauseOnHover)}
        onTouchEnd={() => handlePressEnd(enablePressToHide)}
        onMouseDown={() => handlePressStart(enablePressToHide, pauseOnHover)}
        onMouseUp={() => handlePressEnd(enablePressToHide)}
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          borderRadius: theme.radius[24],
          flex: "none",
          bgcolor: "#000000",
          cursor: enablePressToHide ? "pointer" : "default",
          ...style?.wrapper,
        }}
      >
        {/* Absolute Background Layer Stack */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          {slides.map((slide, idx) => {
            const isSelected = idx === currentIndex;
            const assetStyles = {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover" as const,
              opacity: isSelected ? 1 : 0,
              transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
              border: "none",
            };

            if (slide.media.type === "VIDEO") {
              return (
                <VideoMedia
                  key={`bg-video-${slide.media._id}`}
                  _id={slide.media._id}
                  url={slide.media.url}
                  posterUrl={slide.media.thumbnailUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  viewMode="ISOLATED"
                  style={assetStyles}
                />
              );
            }
            return (
              <Box
                key={`bg-image-${slide.media._id}`}
                sx={{
                  ...assetStyles,
                  backgroundImage: `url(${slide.media.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            );
          })}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.5) 100%)",
              pointerEvents: "none",
            }}
          />
        </Box>

        {/* Top Control Segment Block Zone */}
        <Stack
          spacing={2}
          sx={{
            position: "relative",
            zIndex: 6,
            width: "100%",
            padding: theme.gap(6),
            boxSizing: "border-box",
            pointerEvents: "auto",
          }}
        >
          {progressBarPosition === "top" && renderedProgressBar}
          {header && (
            <Box
              sx={{
                width: "100%",
                opacity: isContentHidden ? 0 : 1,
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              {header}
            </Box>
          )}
        </Stack>

        {/* Bottom Control Segment Block Zone */}
        <Stack
          justifyContent="flex-end"
          sx={{
            position: "relative",
            zIndex: 5,
            width: "100%",
            height: "100%",
            gap: theme.gap(16),
            padding: theme.boxSpacing(20),
            paddingBottom:
              progressBarPosition === "bottom"
                ? theme.boxSpacing(20)
                : theme.boxSpacing(38),
          }}
        >
          {/* Foreground Content Stack Layer */}
          {slides.map((slide, idx) => {
            const isSelected = idx === currentIndex;
            const slideId = slide.media._id || String(idx);

            return (
              <Box
                key={`content-panel-${slideId}`}
                sx={{
                  position: "relative",
                  zIndex: 5,
                  width: "90%",
                  maxWidth: "600px",
                  boxSizing: "border-box",
                  paddingLeft: theme.gap(2),
                  pointerEvents: "none",
                  display: isSelected ? "flex" : "none",
                  flexDirection: "column",
                  gap: theme.gap(3),
                  color: "#ffffff",
                  opacity: isContentHidden ? 0 : 1,
                  transition: "opacity 0.2s ease-in-out",
                  animation: isSelected
                    ? "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                    : "none",
                  "@keyframes fadeInUp": {
                    "0%": { opacity: 0, transform: "translateY(10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <TransText
                  component={"h5"}
                  sx={{
                    ...theme.typography.h6,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  {slide.headline}
                </TransText>
                <TransText
                  sx={{
                    ...theme.typography.text4,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {slide.tagline}
                </TransText>
              </Box>
            );
          })}
          {progressBarPosition === "bottom" && renderedProgressBar}
        </Stack>
      </Box>
    </A11y>
  );
};
