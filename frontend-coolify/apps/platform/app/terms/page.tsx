"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PLATFORM_TERMS_PAGE } from "@repo/core";
import {
  TransText,
  StaticSectionBlock,
  PageContentTable,
  AppImage,
} from "@repo/shared-ui";
import { getSectionStyle, LAST_UPDATED, SECTIONS } from "./content";
import { asset } from "@repo/assets";
import { useMisc } from "@repo/shared-hooks";

/**
 * Public Terms of Use / User Agreement page for Funstakes.
 */
export default function TermsOfUsePage() {
  const theme = useTheme();
  const { titleSx, bodySx, metaSx } = getSectionStyle(theme);
  const { isDesktop } = useMisc();

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
        title={PLATFORM_TERMS_PAGE.nav_title}
        sections={SECTIONS}
        shouldFloat
        isCollapsible
        hideOnPageBottom
      />

      {/* Hero section */}
      <Stack
        sx={{
          flexDirection: "row",
          position: "relative",
          borderRadius: isDesktop ? theme.radius[24] : theme.radius[12],
          overflow: "hidden",
          background: theme.fixedColors.pTrans,
          height: "fit-content",
          minHeight: isDesktop ? 200 : "fit-content",
          gap: 0,
        }}
      >
        <Stack
          sx={{
            justifyContent: "center",
            gap: theme.gap(12),
            padding: theme.boxSpacing(24),
            [theme.breakpoints.down("md")]: {
              padding: theme.boxSpacing(20),
            },
          }}
        >
          <TransText
            {...PLATFORM_TERMS_PAGE.page_headline}
            component="h1"
            sx={{
              ...theme.typography.h5,
              color: theme.palette.gray[300],
            }}
          />
          <TransText
            {...PLATFORM_TERMS_PAGE.page_tagline}
            sx={{ ...bodySx, color: theme.palette.gray[200] }}
          />
          <TransText
            component="span"
            {...PLATFORM_TERMS_PAGE.last_updated(LAST_UPDATED)}
            sx={metaSx}
          />
        </Stack>

        {isDesktop && (
          <AppImage
            src={asset.marketingImg3}
            alt="Terms of use image"
            fill
            prioritize
          />
        )}
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
