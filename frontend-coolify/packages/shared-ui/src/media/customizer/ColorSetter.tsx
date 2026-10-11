"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { IconButton } from "@mui/material";
import { ColorType } from "@repo/core";
import { useColorSetter } from "@repo/shared-hooks";

export interface ColorSetterProps {
  activeColorType?: ColorType;
  disabled?: boolean;
  onColorChange?: (colorType: ColorType) => void;
}

export const ToggleBox = styled(IconButton)(({ theme }) => ({
  ...theme.typography.text3,
  width: 32,
  height: 32,
  borderRadius: theme.radius[12],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px solid ${theme.fixedColors.gray50}`,
  transition: "all 0.2s ease-in-out",
  fontWeight: 700,
  cursor: "pointer",
}));

export const ColorSetter = ({
  activeColorType = "CLEAR_LIGHT",
  disabled = false,
  onColorChange,
}: ColorSetterProps) => {
  const { activeConfig, toggleNextColor } = useColorSetter({
    activeColorType,
    onColorChange,
  });

  return (
    <ToggleBox
      disabled={disabled}
      onClick={toggleNextColor}
      sx={{
        backgroundColor: activeConfig.backgroundColor,
        color: activeConfig.color,
        opacity: disabled ? 0.4 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      T
    </ToggleBox>
  );
};
