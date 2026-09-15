"use client";

import React from "react";
import { Button, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { crossZoneCheck, debouncedPrefetch, prefetchPage } from "@repo/helpers";
import { GenericStyle } from "@repo/core";
import { A11y } from "./A11y";
import { Theme } from "@mui/material/styles";

/**
 * Prefetches cross-zone asset bundles on relevant navigation user intents.
 */
const handlePrefetch = (
  href: string,
  isCrossZone: boolean,
  onHover = false,
) => {
  if (!isCrossZone) return;
  if (onHover) debouncedPrefetch(href, !!isCrossZone);
  else prefetchPage(href, isCrossZone);
};

export type ButtonSize = "x-small" | "small" | "medium" | "large";
export type ButtonColor = "success" | "error" | "primary";
type ButtonVariant = "text" | "contained" | "outlined";

interface ButtonProps {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  size?: ButtonSize;
  style?: GenericStyle;
  overrideStyle?: "full" | "partial";
  colorType?: ButtonColor;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  options?: any;
  submit?: boolean;
}

const getButtonSize = (size: ButtonSize = "medium", theme: Theme) => {
  const xSmallSize = {
    ...theme.typography.text6,
    padding: theme.boxSpacing(2, 5),
  };
  const smallSize = {
    ...theme.typography.text4,
    padding: theme.boxSpacing(4, 8),
  };
  const mediumSize = {
    ...theme.typography.text3,
    padding: theme.boxSpacing(6, 12),
  };
  const largeSize = {
    ...theme.typography.text2,
    padding: theme.boxSpacing(8, 16),
  };

  return size === "x-small"
    ? xSmallSize
    : size === "small"
      ? smallSize
      : size === "medium"
        ? mediumSize
        : largeSize;
};

/**
 * Global application button offering unified routing capabilities and internationalization.
 */
export const AppButton = ({
  variant = "contained",
  size = "medium",
  children,
  colorType = "primary",
  style = {},
  overrideStyle = "partial",
  onClick,
  href,
  options = {},
  submit = false,
}: ButtonProps) => {
  const theme = useTheme();
  const btnSize = getButtonSize(size, theme);

  const defaultStyle = {
    ...btnSize,
    fontWeight: 600,
    minWidth: "fit-content",
    height: "unset",
    textAlign: "center",
    alignSelf: "unset",
    textTransform: "unset",
    display: "flex",
    gap: theme.gap(4),
    alignItems: "center",
  };
  const textVarDefaultStyle = {
    ...btnSize,
    fontWeight: 600,
    height: "unset",
    textAlign: "center",
    textTransform: "unset",
    minWidth: "unset",
    alignSelf: "unset",
  };
  const mergedStyle =
    overrideStyle === "full"
      ? style
      : {
          ...(variant === "text" ? textVarDefaultStyle : defaultStyle),
          ...style,
        };

  const buttonProps = {
    variant,
    color: colorType,
    sx: mergedStyle,
    ...(onClick && {
      onClick: (e: React.MouseEvent<HTMLElement>) => onClick(e),
    }),
    ...options,
  };

  if (href) {
    const isCrossZone = crossZoneCheck(href);
    return (
      <A11y useCase="interactive">
        <Button
          component={isCrossZone ? "a" : NextLink}
          href={href}
          onMouseEnter={() => handlePrefetch(href, isCrossZone, true)}
          onMouseDown={() => handlePrefetch(href, isCrossZone)}
          onTouchStart={() => handlePrefetch(href, isCrossZone)}
          {...buttonProps}
        >
          {children}
        </Button>
      </A11y>
    );
  }
  return (
    <A11y useCase="interactive">
      <Button type={submit ? "submit" : "button"} {...buttonProps}>
        {children}
      </Button>
    </A11y>
  );
};

type AnchorLinkProps = Omit<ButtonProps, "variant">;
/**
 * Structural link surface standardizing microservice cross-zone navigations and translation keys.
 */
export const AnchorLink = ({
  children,
  href,
  style = {},
  size = "small",
  overrideStyle = "partial",
  ...rest
}: AnchorLinkProps) => {
  const theme = useTheme();
  const btnSize = getButtonSize(size, theme);

  const defaultStyle = {
    ...btnSize,
    width: "fit-content",
    display: "inline-flex",
    textAlign: "center",
    textDecoration: "none",
    color: theme.palette.gray[300],
    padding: 0,
    transition:
      "background-color 0.3s linear, color 0.2s linear, stroke 0.2s linear",
    [theme.breakpoints.down("md")]: {
      padding: 0,
    },
  };
  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };

  if (!href) return;
  const isCrossZone = crossZoneCheck(href);

  return (
    <A11y useCase="interactive">
      <Link
        component={isCrossZone ? "a" : NextLink}
        href={href}
        sx={{
          ...mergedStyle,
        }}
        onMouseEnter={() => handlePrefetch(href, isCrossZone, true)}
        onMouseDown={() => handlePrefetch(href, isCrossZone)}
        onTouchStart={() => handlePrefetch(href, isCrossZone)}
        {...rest}
      >
        {children}
      </Link>
    </A11y>
  );
};
