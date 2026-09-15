"use client";

import React from "react";
import { Chip, ChipProps, useTheme } from "@mui/material";
import { X } from "lucide-react";
import { ButtonSize } from "./Buttons";
import { Theme } from "@mui/material/styles";

export interface AppChipProps extends Omit<ChipProps, "onDelete"> {
  label: React.ReactNode;
  onRemove: () => void;
  customIcon?: React.ReactElement;
  iconSize?: number;
  isRemovable?: boolean;
  textSize?: ButtonSize;
}

/**
 * Returns typography style object based on button size context.
 */
const getFontSize = (size: ButtonSize, theme: Theme) => {
  const xSmallSize = theme.typography.text6;
  const smallSize = theme.typography.text4;
  const mediumSize = theme.typography.text3;
  const largeSize = theme.typography.text2;

  return size === "x-small"
    ? xSmallSize
    : size === "small"
      ? smallSize
      : size === "medium"
        ? mediumSize
        : largeSize;
};

/**
 * Renders a chip representing a selected option with a custom remove icon.
 */
export const AppChip: React.FC<AppChipProps> = ({
  label,
  customIcon,
  variant = "filled",
  onRemove,
  iconSize = 14,
  textSize = "x-small",
  color = "secondary",
  isRemovable = true,
  sx,
  ...rest
}) => {
  const theme = useTheme();
  const fontSize = getFontSize(textSize, theme);

  return (
    <Chip
      {...rest}
      variant={variant}
      label={label}
      color={color}
      onDelete={isRemovable ? onRemove : undefined}
      deleteIcon={isRemovable ? <X size={iconSize} /> : undefined}
      icon={customIcon}
      sx={{
        ...fontSize,
        gap: theme.gap(1),
        borderRadius: theme.radius.full,
        padding: theme.boxSpacing(1),
        "& svg": {
          stroke: theme.palette.gray[300],
        },
        ...sx,
      }}
    />
  );
};
