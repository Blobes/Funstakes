"use client";

import { SxProps, Theme } from "@mui/material";

import { asset } from "@repo/assets";
import { rotate } from "./animations";

export const scrollBarStyle = (theme: Theme) => {
  return {
    "&::-webkit-scrollbar": {
      height: "4px",
      width: "4px",
      [theme.breakpoints.down("md")]: {
        height: "2px",
        width: "2px",
      },
    },
    "&::-webkit-scrollbar-track": {
      borderRadius: theme.radius[8],
      margin: "0px 8px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: theme.palette.gray[100] /* Scrollbar color */,
      borderRadius: theme.radius[8],
      boxShadow: "inset 0 0 4px 4px rgba(0, 0, 0, 0.1)",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: theme.palette.gray.trans[2] /* Color on hover */,
    },
  };
};

export const autoScroll = () => ({
  base: {
    overflowY: "auto",
    height: "100%",
    "&::-webkit-scrollbar": {
      width: "0px",
    },
  },
  mobile: {
    height: "fit-content",
    width: "100%",
    overflowY: "unset",
  },
});

/**
 * Truncates text to a specified number of lines using webkit box properties.
 */
export const lineClamp = (lines: number = 2): SxProps<Theme> => ({
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
});

interface BgConfig {
  url?: string;
  opacity?: number;
  zIndex?: number;
  contain?: boolean;
}
/**
 * Applies a background pattern to an element.
 * The 'contain' flag determines if the pattern stays within the parent or fills the viewport.
 */
export const applyBGPattern = (config: BgConfig = {}) => ({
  // Ensure the parent container can trap absolute children if contain is true
  position: config.contain ? "relative" : "initial",
  overflow: config.contain ? "hidden" : "initial",

  "& > *": { zIndex: 5 },

  "&::before": {
    content: '""',
    position: config.contain ? "absolute" : "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${config.url || asset.doodle})`,
    backgroundRepeat: "repeat",
    backgroundSize: "800px",
    opacity: config.opacity || 0.3,
    zIndex: config.zIndex || 0,
    pointerEvents: "none",
  },
});

export const applyBgEffects = (theme: Theme) => ({
  // Fade in the overlay
  overlay: (baseTrans = 0, hoverTrans = 0.4) => ({
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      bgcolor: theme.fixedColors.grayTrans(baseTrans, "dark"),
      zIndex: 2,
      transition: "background 0.4s ease",
      pointerEvents: "none",
    },
    "&:hover": {
      "&::before": {
        bgcolor: theme.fixedColors.grayTrans(hoverTrans, "dark"),
      },
    },
  }),
  // Apply zoom to the internal box
  zoom: (element: string = ".MuiBox-root") => ({
    [`${element}`]: {
      transition: "transform 0.6s ease",
    },
    "&:hover": {
      [`${element}`]: { transform: "scale(1.05)" },
    },
  }),

  blur: (isActive?: boolean, offset?: number) => ({
    backdropFilter:
      isActive && offset
        ? `blur(${isActive ? Math.max(0, 6 - offset / 50) : 0}px)`
        : "blur(6px)",
  }),

  opaque: (isActive?: boolean, offset?: number) => ({
    backgroundColor:
      isActive && offset
        ? theme.palette.gray.trans.overlay(isActive ? 0.6 - offset / 400 : 0)
        : theme.palette.gray.trans.overlay(0.6),
  }),
});

export type BGEffects = ReturnType<typeof applyBgEffects>;

interface BorderParams {
  borderWidth?: number;
  duration?: string;
  borderColor?: string;
  borderRadius?: string;
}
export const animatedBorder = ({
  borderWidth = 1,
  duration = "20s",
  borderColor,
  borderRadius,
}: BorderParams) => {
  const magicColorMix = `linear-gradient( #7928ca, #0070f3, #00dfd8)`;
  return {
    position: "relative",
    zIndex: 0,
    overflow: "hidden",
    borderRadius: borderRadius,

    "&::before": {
      content: '""',
      position: "absolute",
      zIndex: -2,
      left: "-50%",
      top: "-50%",
      width: "300%",
      height: "300%",
      background: borderColor || magicColorMix,
      animation: `${rotate} ${duration} linear infinite`,
    },

    "&::after": {
      content: '""',
      position: "absolute",
      zIndex: -1,
      inset: borderWidth,
      borderRadius: borderRadius,
      backgroundColor: "inherit",
    },
  };
};
