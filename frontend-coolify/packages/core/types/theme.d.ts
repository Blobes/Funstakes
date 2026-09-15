import "@mui/material/styles";
import React from "react";

type OverlayFunc = (opacity?: number, adaptive?: boolean) => string;
interface OverlayObj {
  default: string;
  adaptive: string;
}

export interface FixedColors {
  gray50: string;
  gray800: string;
  grayTrans: (opacity?: number, type?: "light" | "dark" | "mixed") => string;
  primary: string;
  pTrans: string;
}

declare module "@mui/material/styles" {
  interface PaletteColor {
    trans: { 1: string; 2: string };
  }
  interface SimplePaletteColorOptions {
    trans?: { 1: string; 2: string };
  }
  interface Palette {
    gray: {
      0: string;
      50: string;
      100: string;
      200: string;
      300: string;
      trans: {
        1: string;
        2: string;
        overlay: OverlayFunc;
      };
    };
    success: {
      light: string;
      main: string;
      dark: string;
      trans: {
        1: string;
        2: string;
      };
    };
    error: {
      light: string;
      main: string;
      dark: string;
      trans: {
        1: string;
        2: string;
      };
    };
  }
  interface PaletteOptions {
    gray?: {
      0?: string;
      50?: string;
      100?: string;
      200?: string;
      300?: string;
      trans?: {
        1?: string;
        2?: string;
        overlay?: OverlayObj | OverlayFunc;
      };
    };
    success?: Partial<Palette["success"]>;
    error?: Partial<Palette["error"]>;
  }

  interface Theme {
    fixedColors: FixedColors;
    radius: Record<string | number, string | number>;
    boxSpacing: (
      top: number,
      right?: number,
      bottom?: number,
      left?: number,
    ) => string;
    gap: (value: number) => string;
  }
  interface ThemeOptions {
    fixedColors?: FixedColors;
    radius?: Record<string | number, string | number>;
    boxSpacing?: (
      top: number,
      right?: number,
      bottom?: number,
      left?: number,
    ) => string;
    gap?: (value: number) => string;
  }
  interface TypographyVariants {
    text1: React.CSSProperties;
    text2: React.CSSProperties;
    text3: React.CSSProperties;
    text4: React.CSSProperties;
    text5: React.CSSProperties;
    text6: React.CSSProperties;
    text6Caps: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    text1?: React.CSSProperties;
    text2?: React.CSSProperties;
    text3?: React.CSSProperties;
    text4?: React.CSSProperties;
    text5?: React.CSSProperties;
    text6?: React.CSSProperties;
    text6Caps?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    text1: true;
    text2: true;
    text3: true;
    text4: true;
    text5: true;
    text6: true;
    text6Caps: true;
  }
}

declare module "*.lottie" {
  const src: string;
  export default src;
}
