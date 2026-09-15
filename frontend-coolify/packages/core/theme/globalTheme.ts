"use client";

import { green, grey, red } from "@mui/material/colors";
import { createTheme, PaletteColor } from "@mui/material/styles";
import { CSS_VARS } from "../constants/cssVars";
import defaultUIStyles from "./defaultUIStyles";

const baseTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          light: "#8395FF",
          main: "#506AFF",
          dark: "#3D4CD1",
        },
        gray: {
          0: "#ffffff",
          50: "#E8ECF5",
          100: "#BCC8DA",
          200: "#6F7E99",
          300: "#13171D",
          trans: {
            1: "rgba(1, 7, 30, 0.06)",
            2: "rgba(1, 14, 24, 0.12)",
            overlay: {
              default: "1, 6, 19",
              adaptive: "8, 27, 95",
            },
          },
        },
        success: {
          light: green[300],
          main: green[500],
          dark: green[700],
          trans: {
            1: "rgba(14, 183, 14, 0.06)",
            2: "rgba(59, 208, 56, 0.16)",
          },
        },
        info: {
          light: "#E8EDFF",
          main: "#121D4A",
          dark: "#10142C",
        },
        error: {
          light: "#FFF2F4",
          main: "#EF5350",
          dark: "#DF3848",
          trans: {
            1: "rgba(183, 14, 14, 0.06)",
            2: "rgba(208, 56, 56, 0.16)",
          },
        },
        tonalOffset: 0.6,
        contrastThreshold: 4.5,
      },
    },
    dark: {
      palette: {
        primary: {
          light: "#485BC6",
          main: "#5D71EC",
          dark: "#8396FF",
        },
        gray: {
          0: "#11131B",
          50: "#272D4F",
          100: "#476183",
          200: "#8399B4",
          300: "#ffffff",
          trans: {
            1: "rgba(173, 218, 255, 0.08)",
            2: "rgba(173, 218, 255, 0.2)",
            overlay: {
              default: "1, 6, 19",
              adaptive: "40, 57, 217",
            },
          },
        },
        success: {
          light: green[700],
          main: green[500],
          dark: green[300],
          trans: {
            1: "rgba(173, 255, 177, 0.08)",
            2: "rgba(153, 255, 180, 0.4)",
          },
        },
        info: {
          light: "#0A0D1C",
          main: "#E7EBFF",
          dark: "#BBC4E8",
        },
        error: {
          light: "#170808",
          main: red[400],
          dark: "#F56876",
          trans: {
            1: "rgba(255, 173, 173, 0.08)",
            2: "rgba(255, 153, 153, 0.4)",
          },
        },
        tonalOffset: 0.6,
        contrastThreshold: 4.5,
      },
    },
  },
  fixedColors: {
    gray50: grey[50],
    gray800: "#121421",
    grayTrans: (opacity = 0.12, type: "light" | "dark" | "mixed" = "light") =>
      `rgba( ${type === "light" ? "255, 255, 255" : type === "dark" ? "3, 6, 19" : "72, 107, 246"}, ${opacity})`,
    primary: "#9FAEFF",
    pTrans: "rgba(72, 107, 246, 0.12)",
  } as const,
  typography: {
    fontFamily:
      "var(--ui-font-family, 'Satoshi','Manrope','Cabinet Grotesk', Arial, sans-serif)",
    h1: { fontWeight: 600, textAlign: "var(--ui-text-align, inherit)" as any },
    h2: { fontWeight: 600, textAlign: "var(--ui-text-align, inherit)" as any },
    h4: {
      fontSize: "clamp(2rem, 5vw, calc(2.5rem * var(--ui-font-scale, 1)))", // sm: 2rem 32px | lg: 2.5rem 40px
      fontWeight: 700,
      lineHeight: 1.2,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    h5: {
      fontWeight: 700,
      fontSize: "clamp(1.625rem, 4vw, calc(2rem * var(--ui-font-scale, 1)))", // sm: 1.625rem 26px | lg: 2rem 32px
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    h6: {
      fontWeight: 700,
      fontSize:
        "clamp(1.375rem, 3.5vw, calc(1.625rem * var(--ui-font-scale, 1)))", // sm: 1.375rem 22px | lg: 1.625rem 26px
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text1: {
      fontSize:
        "clamp(1.25rem, 2.8vw, calc(1.375rem * var(--ui-font-scale, 1)))", // sm: 1.25rem 20px | lg: 1.375rem 22px
      fontWeight: 700,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text2: {
      fontSize: "calc(1.125rem * var(--ui-font-scale, 1))", // 1.125rem 18px
      fontWeight: 600,
      lineHeight: 1.3,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text3: {
      fontSize: "calc(1rem * var(--ui-font-scale, 1))", // 1rem 16px
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text4: {
      fontSize: "calc(0.9375rem * var(--ui-font-scale, 1))", // 0.9375rem 15px
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text5: {
      fontSize: "calc(0.875rem * var(--ui-font-scale, 1))", // 0.875rem 14px
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text6: {
      fontSize: "calc(0.8125rem * var(--ui-font-scale, 1))", // 0.8125rem 13px
      fontWeight: 600,
      letterSpacing: 0.05,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text6Caps: {
      fontSize: "calc(0.8125rem * var(--ui-font-scale, 1))", // 0.8125rem 13px
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.05,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
  },
  radius: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    full: "1000px",
  },
  boxSpacing: (top, right, bottom, left) => {
    const multi = "var(--ui-density-base, 2px)";
    return `calc(${top} * ${multi}) ${right || right === 0 ? `calc(${right} * ${multi})` : ""} ${
      bottom || bottom === 0 ? `calc(${bottom} * ${multi})` : ""
    } ${left || left === 0 ? `calc(${left} * ${multi})` : ""}`;
  },
  gap: (value = 0) => `calc(${value} * var(--ui-density-base, 2px))`,
});

baseTheme.palette.primary = {
  light: CSS_VARS.color_primary_light,
  main: CSS_VARS.color_primary_main,
  dark: CSS_VARS.color_primary_dark,
} as PaletteColor;

baseTheme.palette.gray = {
  0: CSS_VARS.color_gray0,
  50: CSS_VARS.color_gray50,
  100: CSS_VARS.color_gray100,
  200: CSS_VARS.color_gray200,
  300: CSS_VARS.color_gray300,
  trans: {
    1: CSS_VARS.color_gray_trans_1,
    2: CSS_VARS.color_gray_trans_2,
    overlay: (opacity?: number, adaptive: boolean = false) => {
      const activeVariable = adaptive
        ? CSS_VARS.color_gray_trans_overlay_adaptive
        : CSS_VARS.color_gray_trans_overlay_default;
      return `rgba(${activeVariable}, ${opacity ?? 0.5})`;
    },
  },
};

baseTheme.palette.success = {
  light: CSS_VARS.color_success_light,
  main: CSS_VARS.color_success_main,
  dark: CSS_VARS.color_success_dark,
  trans: {
    1: CSS_VARS.color_success_trans_1,
    2: CSS_VARS.color_success_trans_2,
  },
} as PaletteColor;

baseTheme.palette.info = {
  light: CSS_VARS.color_info_light,
  main: CSS_VARS.color_info_main,
  dark: CSS_VARS.color_info_dark,
} as PaletteColor;

baseTheme.palette.error = {
  light: CSS_VARS.color_error_light,
  main: CSS_VARS.color_error_main,
  dark: CSS_VARS.color_error_dark,
  trans: {
    1: CSS_VARS.color_error_trans_1,
    2: CSS_VARS.color_error_trans_2,
  },
} as PaletteColor;

baseTheme.components = defaultUIStyles.components as any;

export default baseTheme;
