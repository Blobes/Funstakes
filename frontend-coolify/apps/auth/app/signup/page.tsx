"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Signup } from "./registration/Signup";
import { Stack } from "@mui/material";
import { asset, BG_SLIDER_DATA } from "@repo/assets";
import { BGFadeCarousel } from "@repo/shared-ui";
import { applyBGPattern } from "@repo/helpers";
import { useStaticTranslation } from "@repo/shared-hooks";

export default function SignupPage() {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        padding: theme.boxSpacing(8),
        flexDirection: "row",
        alignItems: "center",
        gap: 0,
        ...applyBGPattern({ url: asset.bgNoise, opacity: 0.3 }),
        [theme.breakpoints.up("xl")]: {
          margin: "auto auto",
          maxHeight: "56svh",
          maxWidth: "60svw",
        },
        [theme.breakpoints.down("md")]: {
          maxHeight: "unset",
          overflow: "auto",
          flexDirection: "column",
          padding: theme.boxSpacing(0),
          scrollSnapType: "y proximity",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      }}
    >
      <Signup />
      <BGFadeCarousel
        slides={BG_SLIDER_DATA(translateTxtString)}
        autoPlay
        pauseOnHover
        interval={7000}
        style={{
          wrapper: {
            width: "50%",
            height: "100%",
            minHeight: 420,
            borderRadius: theme.radius[20],
            [theme.breakpoints.down("md")]: {
              width: "100%",
              height: "100svh",
              scrollSnapAlign: "start",
              borderRadius: 0,
            },
          },
        }}
      />
    </Stack>
  );
}
