"use client";

import React, { useMemo } from "react";
import { IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { RefreshCcw } from "lucide-react";
import { BasicTooltip } from "./Tooltips";
import { DisplayFeedbackUIType, FeedbackProps } from "@repo/core";
import { TransText } from "./Text";
import { useDisplayFBConfig } from "@repo/shared-hooks";

/**
 * Standardized empty-state, success, and contextual user action feedback layouts.
 */
export const Feedback: React.FC<FeedbackProps> = ({
  headline,
  tagline,
  icon,
  style,
  primaryCta,
  secondaryCta,
}) => {
  const theme = useTheme();

  const primaryCtaType = primaryCta?.type || "BUTTON";
  const secondaryCtaType = secondaryCta?.type || "BUTTON";
  const primHref = primaryCta?.href ? { href: primaryCta?.href } : {};
  const secHref = secondaryCta?.href ? { href: secondaryCta?.href } : {};

  return (
    <Stack sx={style?.container}>
      {/* Icon */}
      {icon && <Stack sx={style?.icon}>{icon}</Stack>}

      <Stack sx={{ gap: theme.gap(5) }}>
        {/* Headline */}
        {headline && (
          <TransText component="h6" sx={style?.headline}>
            {headline}
          </TransText>
        )}
        {/* Tagline */}
        {tagline && <TransText sx={style?.tagline}>{tagline}</TransText>}
      </Stack>

      {/* Primary CTA */}
      {primaryCta &&
        (primaryCtaType === "BUTTON" ? (
          <AppButton
            variant={primaryCta.variant || "contained"}
            size="small"
            {...primHref}
            style={style?.primaryCta}
            onClick={primaryCta.action}
          >
            {primaryCta.label}
          </AppButton>
        ) : (
          <BasicTooltip title={primaryCta.toolTip || ""}>
            <IconButton onClick={primaryCta.action} {...primHref}>
              {primaryCta.label || <RefreshCcw />}
            </IconButton>
          </BasicTooltip>
        ))}

      {/* Secondary CTA */}
      {secondaryCta &&
        (secondaryCtaType === "BUTTON" ? (
          <AppButton
            variant="text"
            size="small"
            onClick={secondaryCta.action}
            {...secHref}
            style={style?.secondaryCta}
          >
            {secondaryCta.label}
          </AppButton>
        ) : (
          <BasicTooltip title={secondaryCta.toolTip || ""}>
            <IconButton onClick={secondaryCta.action} {...secHref}>
              {secondaryCta.label || <RefreshCcw />}
            </IconButton>
          </BasicTooltip>
        ))}
    </Stack>
  );
};

interface DisplayUIProps extends FeedbackProps {
  type: DisplayFeedbackUIType;
  showCta?: { primary?: boolean; secondary?: boolean };
}
/**
 * A generic UI for restricted access states.
 */
export const DisplayFeedbackUI = ({
  type,
  headline,
  tagline,
  icon,
  primaryCta,
  secondaryCta,
  showCta = {},
  style,
}: DisplayUIProps) => {
  const theme = useTheme();
  const config = useDisplayFBConfig()[type];
  const { primary = true, secondary = true } = showCta;

  const handlePrimaryCta = useMemo(() => {
    if (!primary) return undefined;
    return primaryCta ?? config.primaryCta;
  }, [config.primaryCta, primaryCta]);

  const handleSecondaryCta = useMemo(() => {
    if (!secondary) return undefined;
    return secondaryCta ?? config.secondaryCta;
  }, [config.secondaryCta, secondaryCta]);

  return (
    <Feedback
      headline={headline ?? config.headline}
      tagline={tagline ?? config.tagline}
      icon={icon ?? config.icon}
      primaryCta={handlePrimaryCta}
      secondaryCta={handleSecondaryCta}
      style={{
        container: {
          padding: theme.boxSpacing(18),
          backgroundColor: theme.palette.gray[0],
          borderRadius: theme.radius[3],
          alignItems: "center",
          justifyContent: "center",
          gap: theme.gap(14),
          border: `1px solid ${theme.fixedColors.pTrans}`,
          ...(style?.container ?? config.style?.container),
        },
        headline: {
          ...theme.typography.text2,
          textAlign: "center",
          fontWeight: 700,
          ...(style?.headline ?? config.style?.headline),
        },
        tagline: {
          ...theme.typography.text4,
          textAlign: "center",
          color: theme.palette.gray[200],
          ...(style?.tagline ?? config.style?.tagline),
        },
        icon: {
          width: style?.icon?.size || config.style?.icon?.size || 48,
          height: style?.icon?.size || config.style?.icon?.size || 48,
          alignItems: "center",
          justifyContent: "center",
          ...(style?.icon ?? config.style?.icon),
          "& svg": {
            width: "100%",
            height: "100%",
            stroke: theme.palette.gray[200],
            strokeWidth: 1.5,
            ...(style?.icon?.svg || config.style?.icon?.svg),
          },
        },
      }}
    />
  );
};
