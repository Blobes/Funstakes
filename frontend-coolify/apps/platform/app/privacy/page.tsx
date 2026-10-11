"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PLATFORM_PRIVACY_PAGE } from "@repo/core";
import {
  TransText,
  StaticSectionBlock,
  PageContentTable,
} from "@repo/shared-ui";
import { LAST_UPDATED, SECTIONS } from "./content";
import { asset } from "@repo/assets";
import { applyBgEffects } from "@repo/helpers";
import { getSectionStyle } from "../terms/content";

/**
 * Public Privacy Policy page for Funstakes.
 */
export default function PrivacyPolicyPage() {
  const theme = useTheme();
  const { titleSx, bodySx, metaSx } = getSectionStyle(theme);

  return (
    <Stack
      sx={{
        width: "100%",
        maxWidth: 1024,
        minHeight: "fit-content",
        padding: theme.boxSpacing(24),
        gap: theme.gap(20),
        alignSelf: "center",
        [theme.breakpoints.down("md")]: {
          padding: theme.boxSpacing(10),
          minHeight: "unset",
        },
      }}
    >
      {/* Table of content */}
      <PageContentTable
        title={PLATFORM_PRIVACY_PAGE.nav_title}
        sections={SECTIONS}
        shouldFloat
        isCollapsible
        hideOnPageBottom
      />

      {/* Hero section */}
      <Stack
        sx={{
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.gap(12),
          backgroundImage: `url(${asset.marketingImg1})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          padding: theme.boxSpacing(26),
          borderRadius: theme.radius[40],
          overflow: "hidden",
          ...applyBgEffects(theme).overlay(0.6, 0.6),
          [theme.breakpoints.down("md")]: {
            padding: theme.boxSpacing(26, 20),
          },
        }}
      >
        <TransText
          {...PLATFORM_PRIVACY_PAGE.page_headline}
          component="h1"
          sx={{
            ...theme.typography.h4,
            color: theme.fixedColors.gray50,
            zIndex: 10,
          }}
        />
        <TransText
          {...PLATFORM_PRIVACY_PAGE.page_tagline}
          sx={{
            ...bodySx,
            width: "60%",
            color: theme.fixedColors.gray50,
            textAlign: "center",
            zIndex: 10,
            [theme.breakpoints.down("md")]: {
              width: "100%",
            },
          }}
        />
        <TransText
          component="span"
          {...PLATFORM_PRIVACY_PAGE.last_updated(LAST_UPDATED)}
          sx={{
            ...metaSx,
            color: theme.fixedColors.grayTrans(0.7, "light"),
            zIndex: 10,
          }}
        />
      </Stack>

      {/* Content section */}
      <Stack sx={{ gap: theme.gap(12) }}>
        {SECTIONS.map((section) => (
          <StaticSectionBlock
            key={section.id}
            section={section}
            bodySx={bodySx}
            titleSx={titleSx}
          />
        ))}
      </Stack>
    </Stack>
  );
}
