import React from "react";
import { SxProps, useTheme } from "@mui/material/styles";
import { SVGWrapper } from "./SvgWrapper";
import { asset } from "@repo/assets";

export interface AppLogoProps {
  color?: string;
  size?: number | string;
  withName?: boolean;
  sx?: SxProps;
}

/**
 * Renders the application logo symbol with configurable color and size.
 */
export const AppLogo = ({
  color,
  size = 40,
  withName = false,
  sx,
}: AppLogoProps) => {
  const theme = useTheme();

  return withName ? (
    <SVGWrapper
      src={asset.appLogoName}
      fallbackUIType="SKELETON"
      color={color ?? theme.palette.primary.dark}
      sx={{ width: size, ...sx }}
    />
  ) : (
    <SVGWrapper
      src={asset.appLogoSymbol}
      color={color ?? theme.palette.gray[300]}
      size={size}
      fallbackUIType="SKELETON"
      sx={{
        flex: "none",
        ...sx,
      }}
    />
  );
};
