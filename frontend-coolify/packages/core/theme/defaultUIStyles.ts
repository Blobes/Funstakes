"use client";

import { Components, Theme } from "@mui/material/styles";

/**
 * Central design tokens used across component style overrides.
 */
const VARS = {
  color_primary_main: "var(--mui-palette-primary-main)",
  color_primary_dark: "var(--mui-palette-primary-dark)",
  color_primary_light: "var(--mui-palette-primary-dark)",
  color_primary_trans: "var(--mui-fixedColors-pTrans)",
  color_gray0: "var(--mui-palette-gray-0)",
  color_gray50: "var(--mui-palette-gray-50)",
  color_gray100: "var(--mui-palette-gray-100)",
  color_gray200: "var(--mui-palette-gray-200)",
  color_gray300: "var(--mui-palette-gray-300)",
  color_gray_trans_1: "var(--mui-palette-gray-trans-1)",
  color_gray_trans_2: "var(--mui-palette-gray-trans-2)",
  color_gray_trans_overlay: "var(--mui-palette-gray-trans-overlay)",
  color_fixed_gray800: "var(--mui-fixedColors-gray800)",
  color_success: "var(--mui-palette-info-main)",
  color_error: "var(--mui-palette-error-main)",
  color_error_trans: "var(--mui-palette-error-trans)",
  text_fontsize: "calc(1rem * var(--ui-font-scale, 1))",
  text_align: "var(--ui-text-align, inherit)" as any,
  text_helper_fontsize: "calc(0.875rem * var(--ui-font-scale, 1))",
} as const;

interface BaseStylesContainer {
  components: Components<Omit<Theme, "components">>;
}

/**
 * Base MUI theme components configuration with dynamic style overrides.
 */
const defaultUIStyles: BaseStylesContainer = {
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ":root": {
          "--ui-font-scale": "1.00",
          "--ui-density-base": "2px",
        },
        "[data-ui-density='compact']": {
          "--ui-density-base": "1.3px",
        },
        "[data-ui-dyslexia='true']": {
          "--ui-font-family":
            "'OpenDyslexic', 'Comic Sans MS', sans-serif !important",
        },
        "[data-ui-motion='reduced'] *": {
          transitionDuration: "0s !important",
          animationDuration: "0s !important",
          transitionDelay: "0s !important",
          animationIterationCount: "1 !important",
          scrollBehavior: "auto !important",
        },
        "[data-ui-contrast='high']": {
          "--mui-palette-primary-main": "#0516FA !important",
          "--mui-palette-primary-dark": "#010A80 !important",
          "--mui-palette-gray-300": "#000000 !important",
          "--mui-palette-gray-200": "#222222 !important",
          borderWidth: "2px !important",
        },
        body: {
          WebkitTapHighlightColor: "transparent",
          "--theme-transition": theme.transitions.create(
            ["background-color", "stroke", "fill"],
            { duration: theme.transitions.duration.standard },
          ),
        },
        "div, svg": {
          transition: "var(--theme-transition)",
        },
        svg: {
          stroke: VARS.color_gray200,
          flexShrink: "0!important",
        },
        "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active":
          {
            WebkitBoxShadow: `0 0 0 1000px rgba(1, 14, 24, 0) inset !important`,
            transition: "background-color 5000s ease-in-out 0s",
          },
      }),
    },

    MuiUseMediaQuery: {
      defaultProps: {
        noSsr: true,
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: () => ({
          color: "inherit",
          margin: "0px",
          width: "inherit",
        }),
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.boxSpacing(4, 9),
          borderRadius: theme.radius.full,
          alignSelf: "flex-start",
          height: "40px",
          fontWeight: "500",
          "&:disabled": {
            cursor: "not-allowed",
            pointerEvents: "auto",
          },
        }),
        contained: () => ({
          backgroundColor: VARS.color_primary_main,
          color: VARS.color_gray300,
          "&:hover": { backgroundColor: VARS.color_primary_dark },
          "&:disabled": {
            backgroundColor: VARS.color_primary_main,
            color: VARS.color_gray300,
            opacity: 0.6,
          },
        }),
        outlined: () => ({
          borderColor: VARS.color_gray_trans_2,
          color: VARS.color_gray300,
          "&:hover": {
            backgroundColor: VARS.color_primary_trans,
            borderColor: VARS.color_primary_trans,
          },
          "&:disabled": {
            color: VARS.color_gray300,
            backgroundColor: VARS.color_gray_trans_2,
            borderColor: "transparent",
            opacity: 0.6,
          },
        }),
        text: () => ({
          "&:disabled": {
            color: VARS.color_gray300,
            opacity: 0.7,
          },
        }),
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          ...theme.typography.text6,
          padding: theme.boxSpacing(3, 5),
          backgroundColor: VARS.color_fixed_gray800,
          color: VARS.color_gray50,
          borderRadius: theme.radius[3],
          boxShadow: "var(--mui-shadows-1)",
          maxWidth: 420,
          margin: theme.boxSpacing(0, 6),
          border: `1px solid ${VARS.color_gray_trans_2}`,
        }),
        arrow: ({ theme }) => ({
          ...theme.typography.text6,
          color: VARS.color_fixed_gray800,
        }),
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.boxSpacing(3),
          margin: 0,
          "&:hover": { backgroundColor: VARS.color_primary_trans },
          "&:disabled": {
            backgroundColor: VARS.color_gray_trans_overlay,
            opacity: 0.6,
          },
        }),
      },
    },

    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          overflow: "hidden",
          [theme.breakpoints.down("sm")]: { padding: theme.boxSpacing(3) },
          [theme.breakpoints.between("sm", "lg")]: {
            padding: theme.boxSpacing(6),
          },
          [theme.breakpoints.up("lg")]: {
            padding: theme.boxSpacing(8),
            maxWidth: "1440px",
          },
        }),
      },
    },

    MuiStack: {
      styleOverrides: {
        root: ({ theme }) => ({
          gap: theme.gap(4),
        }),
      },
    },

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: VARS.color_primary_trans,
          borderRadius: theme.radius[4],
          boxShadow: "unset",
        }),
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({ gap: theme.gap(2) }),
        avatar: () => ({ margin: 0 }),
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 8 },
      styleOverrides: {
        root: ({ theme }) => ({ borderRadius: theme.radius[4] }),
        elevation: () => ({
          backgroundColor: VARS.color_gray0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
        }),
        outlined: () => ({
          backgroundColor: "unset",
          border: `1px solid ${VARS.color_gray_trans_1}`,
        }),
        elevation8: {
          boxShadow: "4px 8px 24px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: VARS.color_gray0,
          borderRadius: theme.radius[4],
        }),
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: "none",
          "--AppBar-background": "none",
          "--mui-palette-AppBar-darkBg": "none",
          borderRadius: theme.radius[0],
          boxShadow: "none",
          minHeight: "44px",
          padding: theme.boxSpacing(8, 18),
          [theme.breakpoints.down("md")]: {
            minHeight: "32px",
            padding: theme.boxSpacing(5),
          },
        }),
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("lg")]: {
            minHeight: "32px",
            padding: theme.boxSpacing(3),
          },
        }),
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: "100%",
          margin: theme.boxSpacing(4, 0),
        }),
      },
    },

    MuiFormControl: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.custom-select-form-style": {
            "& .MuiInputLabel-root": {
              width: "100%",
              height: "100%",
              padding: theme.boxSpacing(3, 4),
              borderRadius: theme.radius[1],
              transform: "unset",
              pointerEvents: "none",
              opacity: 0,
              fontWeight: 600,
              color: VARS.color_gray200,
              "&.Mui-focused, &.MuiFormLabel-filled": {
                width: "unset",
                height: "unset",
                transform: "translate(12px, -14px) scale(0.8)",
                backgroundColor: VARS.color_gray0,
                opacity: 1,
              },
              "&.Mui-focused": {
                color: VARS.color_primary_main,
              },
            },
          },
        }),
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: VARS.text_fontsize,
          fontWeight: 500,
          backgroundColor: "transparent",
          border: `1px solid ${VARS.color_gray100}`,
          cursor: "pointer",
          padding: theme.boxSpacing(7, 4, 7, 9),
          borderRadius: theme.radius[4],
          "&:hover": {
            border: `1px solid ${VARS.color_primary_main}`,
            opacity: 1,
            color: VARS.color_primary_main,
          },
          "&.Mui-focused": {
            border: `1px solid ${VARS.color_primary_main}`,
          },
          "&.Mui-disabled": {
            cursor: "not-allowed",
            opacity: 0.6,
          },
          "& .MuiSelect-select": {
            padding: "0 !important",
            display: "flex",
            alignItems: "center",
            "&:hover": { opacity: 1 },
          },
        }),
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiInputBase-input": {
            fontSize: VARS.text_fontsize,
            fontWeight: 500,
            textAlign: VARS.text_align,
            "&.Mui-disabled": { cursor: "not-allowed !important" },
          },

          "& .MuiInputLabel-root": {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            overflow: "unset",
            width: "100%",
            maxWidth: "calc(97% - 24px)",
            fontSize: VARS.text_fontsize,
            transform: "translate(16px, 17px)",
            fontWeight: "500",
            color: VARS.color_gray200,
            pointerEvents: "none",
          },

          "&:has(.MuiInputBase-adornedEnd .MuiInputAdornment-positionEnd) .MuiInputLabel-root":
            {
              maxWidth: "calc(100% - 60px)",
            },

          "& label.Mui-focused, & label.MuiInputLabel-shrink": {
            position: "absolute",
            color: VARS.color_gray200,
            transform: "translate(16px, 7px) scale(0.83)",
            borderRadius: theme.radius[1],
            padding: 0,
            "& .MuiInputLabel-asterisk": {
              display: "none",
            },
          },
          "& label.MuiInputLabel-root.Mui-error.Mui-focused, & label.MuiInputLabel-root.Mui-error":
            {
              color: VARS.color_error,
            },

          "& .MuiInputLabel-asterisk": {
            fontSize: 26,
            fontWeight: 600,
            color: VARS.color_error,
            transform: "translateY(6px)",
          },

          "& .MuiFormHelperText-root": {
            fontSize: VARS.text_helper_fontsize,
            lineHeight: "1.2em",
            fontWeight: "500",
            color: VARS.color_gray200,
            margin: theme.boxSpacing(4, 0, 0, 0),
            textAlign: VARS.text_align,
          },
          "& .MuiFormHelperText-root.Mui-focused": {
            padding: 0,
          },
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          maxWidth: "600px",
          minWidth: "150px",
          borderRadius: theme.radius[4],
          border: `1px solid ${VARS.color_gray50}`,
          backgroundColor: VARS.color_gray50,
          padding: theme.boxSpacing(4.5, 5, 4.5, 0),
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "transparent",
            borderColor: VARS.color_primary_main,
          },
          "&.Mui-focused": {
            backgroundColor: "transparent",
            borderColor: VARS.color_primary_main,
            outline: `2px solid ${VARS.color_primary_trans}`,
            boxShadow: `0 0 0 4px ${VARS.color_primary_trans}`,
            outlineOffset: "1px",
          },
          "&.Mui-disabled": {
            cursor: "not-allowed",
            backgroundColor: VARS.color_gray50,
            borderColor: "transparent",
            opacity: 0.5,
          },
          "&.Mui-error, &.Mui-error:hover": {
            borderColor: VARS.color_error,
            backgroundColor: VARS.color_error_trans,
          },
          "&.Mui-error.Mui-focused": {
            boxShadow: `0 0 0 4px ${VARS.color_error_trans}`,
            backgroundColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            display: "none",
          },
        }),
      },
    },
  },
};

export default defaultUIStyles;
