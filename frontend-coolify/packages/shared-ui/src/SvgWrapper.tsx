"use client";

import React, { useEffect, useState } from "react";
import { Box, BoxProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProgressUI } from "./LoadingUIs";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFramerVariants } from "@repo/helpers";
import { BoxSkeleton } from "./Skeletons";

interface SVGWrapperProps extends BoxProps {
  src: any;
  color?: string;
  size?: number | string;
  preserveColor?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  fbSize?: number | string;
  fallbackUIType?: "SPIN" | "SKELETON";
}

/**
 * Renders static SVGs or Lottie animations.
 * Switches between a fixed-size loader and the custom-sized asset with a smooth transition.
 */
export const SVGWrapper = ({
  src,
  color,
  size = 44,
  fbSize = 44,
  preserveColor = false,
  loop = true,
  autoplay = true,
  fallbackUIType = "SPIN",
  sx,
  ...props
}: SVGWrapperProps) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isLottie, setIsLottie] = useState(false);
  const [isAnimationSettled, setIsAnimationSettled] = useState(false);
  const theme = useTheme();

  const url = typeof src === "object" ? src.src : src;

  useEffect(() => {
    if (!url) return;

    const isLottieAsset =
      url.toLowerCase().endsWith(".json") ||
      url.toLowerCase().endsWith(".lottie");
    setIsLottie(isLottieAsset);

    if (isLottieAsset) {
      const timer = setTimeout(() => setLoading(false), 50);
      return () => clearTimeout(timer);
    }

    setLoading(true);
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        let cleaned = text
          .replace(/width=".*?"/, 'width="100%"')
          .replace(/height=".*?"/, 'height="100%"');

        if (!preserveColor && color) {
          cleaned = cleaned.replace(/fill=".*?"/g, `fill="currentColor"`);
        }
        setSvgContent(cleaned);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Asset Load Error:", err);
        setLoading(false);
      });
  }, [url, preserveColor, color, isLottie]);

  useEffect(() => {
    if (loading) {
      setIsAnimationSettled(false);
    }
  }, [loading]);

  const boxStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: color || "inherit",
    flexShrink: 0,

    "& svg": {
      width: "100%",
      height: "100%",
      display: "block",
      stroke: "none",
    },
    "& canvas": {
      width: "100% !important",
      height: "100% !important",
      display: "block",
    },
  };

  const renderDefaultLoader = () => {
    if (fallbackUIType === "SPIN") {
      return (
        <Box
          sx={{
            width: fbSize,
            height: fbSize,
            padding: theme.boxSpacing(4),
            backgroundColor: theme.palette.gray.trans[1],
            borderRadius: theme.radius.full,
            ...boxStyles,
          }}
        >
          <ProgressUI />
        </Box>
      );
    }
    return (
      <BoxSkeleton
        variant="circular"
        quantity={1}
        width={fbSize}
        height={fbSize}
      />
    );
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loader"
          {...getFramerVariants("FADE")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          }}
        >
          {renderDefaultLoader()}
        </motion.div>
      ) : (
        <Box
          component={motion.div}
          key="content"
          {...getFramerVariants("POP")}
          onAnimationComplete={() => setIsAnimationSettled(true)}
          {...props}
          sx={{
            width: size,
            height: size,
            ...boxStyles,
            ...sx,
          }}
        >
          {isLottie ? (
            isAnimationSettled ? (
              <DotLottieReact
                src={url}
                loop={loop}
                autoplay={autoplay}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            ) : (
              renderDefaultLoader()
            )
          ) : (
            <Box
              component="span"
              sx={{ width: "100%", height: "100%" }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </Box>
      )}
    </AnimatePresence>
  );
};
