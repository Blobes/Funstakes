"use client";

import React, { useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { SVGWrapper } from "./SvgWrapper";
import { asset } from "@repo/assets";
import { AnchorLink } from "./Buttons";
import { BaseStyleProps, CLIENT_ROUTES } from "@repo/core";

export interface AppLogoProps {
  color?: string;
  size?: number | string;
  withName?: boolean;
  style?: BaseStyleProps;
  linkable?: boolean;
  url?: string;
  onClick?: () => void;
  targetBlank?: boolean;
}

/**
 * Renders the application logo symbol with configurable color and size.
 */
export const AppLogo = ({
  color,
  size = 40,
  withName = false,
  linkable = true,
  url = CLIENT_ROUTES.home.path,
  onClick,
  targetBlank = false,
  style,
}: AppLogoProps) => {
  const theme = useTheme();

  const handleLogoClick = useCallback(() => {
    onClick?.();
  }, []);

  const renderLogo = () => {
    return withName ? (
      <SVGWrapper
        src={asset.appLogoName}
        fallbackUIType="SKELETON"
        color={color ?? theme.palette.primary.dark}
        sx={{ width: size, ...style?.item }}
      />
    ) : (
      <SVGWrapper
        src={asset.appLogoSymbol}
        color={color ?? theme.palette.gray[300]}
        size={size}
        fallbackUIType="SKELETON"
        sx={{
          flex: "none",
          ...style?.item,
        }}
      />
    );
  };
  return linkable ? (
    <AnchorLink
      href={url}
      onClick={handleLogoClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style?.itemWrapper,
      }}
      targetBlank={targetBlank}
    >
      {renderLogo()}
    </AnchorLink>
  ) : (
    renderLogo()
  );
};
