"use client";

import React, { useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BaseStyleObj,
  ScrollRefProps,
  StaticContentBlock,
  StaticContentSection,
} from "@repo/core";
import { applyBGPattern, autoScroll, scrollBarStyle } from "@repo/helpers";
import { TransText } from "@repo/shared-ui";
import { asset } from "@repo/assets";

interface RootContainerUIProps extends ScrollRefProps {
  children: React.ReactNode;
  style?: BaseStyleObj;
  shouldScroll?: boolean;
  applyBgPattern?: boolean;
}

export interface ContentBlockProps {
  block: StaticContentBlock;
  titleComponent?: React.ElementType;
  bodySx?: BaseStyleObj;
  titleSx?: BaseStyleObj;
}

export interface SectionBlockProps {
  section: StaticContentSection;
  bodySx?: BaseStyleObj;
  titleSx?: BaseStyleObj;
  subtitleSx?: BaseStyleObj;
  contentGap?: number | string;
}

export const RootUIContainer = ({
  children,
  style,
  shouldScroll = false,
  scrollRef,
  applyBgPattern = true,
}: RootContainerUIProps) => {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.classList.add("hydrated");
    document.documentElement.style.removeProperty("background-color");
  }, []);

  const combinedStyle: BaseStyleObj = {
    ...(applyBGPattern && applyBGPattern({ url: asset.bgNoise, opacity: 0.3 })),
    position: "fixed",
    height: "100svh",
    width: "100%",
    gap: 0,
    backgroundColor: "var(--app-bg)",
    ".hydrated &": {
      backgroundColor: `${theme.palette.gray[0]} !important`,
    },
    ...(shouldScroll && {
      ...autoScroll().base,
      ...scrollBarStyle(theme),
    }),
    ...style,
  };

  return (
    <Stack ref={scrollRef} data-app-scroll-root="true" sx={combinedStyle}>
      {children}
    </Stack>
  );
};

const ContentBlockView = ({
  block,
  bodySx,
  titleSx,
  titleComponent = "h3",
}: ContentBlockProps) => (
  <>
    <TransText {...block.title} component={titleComponent} sx={titleSx} />

    {block.paragraphs?.map((item) => (
      <TransText key={item.tKey || item.tValue} {...item} sx={bodySx} />
    ))}

    {!!block.bullets?.length && (
      <Box
        component="ul"
        sx={{
          m: 0,
          pl: 3,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {block.bullets.map((item) => (
          <TransText
            key={item.tKey || item.tValue}
            {...item}
            component="li"
            sx={{ ...bodySx, display: "list-item" }}
          />
        ))}
      </Box>
    )}
  </>
);
/**
 * Generic static page section: heading, paragraphs, bullets, optional subsections.
 */
export const StaticSectionBlock = ({
  section,
  bodySx,
  titleSx,
  subtitleSx,
  contentGap = 2,
}: SectionBlockProps) => (
  <Stack component="section" id={section.id} sx={{ gap: contentGap }}>
    <ContentBlockView
      block={section}
      bodySx={bodySx}
      titleSx={titleSx}
      titleComponent="h2"
    />

    {section.subsections?.map((sub) => (
      <Stack key={sub.title.tKey || sub.title.tValue} sx={{ gap: 1.5, mt: 1 }}>
        <ContentBlockView
          block={sub}
          bodySx={bodySx}
          titleSx={subtitleSx ?? { ...titleSx, fontSize: undefined }}
          titleComponent="h3"
        />
      </Stack>
    ))}
  </Stack>
);
