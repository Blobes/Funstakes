"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Signup } from "./registration/Signup";
import { Stack } from "@mui/material";
import { asset, BG_SLIDER_DATA } from "@repo/assets";
import { BGFadeCarousel } from "@repo/shared-ui";
import { applyBGPattern, autoScroll } from "@repo/helpers";
import { useStaticTranslation } from "@repo/shared-hooks";

export default function SignupPage() {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        padding: theme.boxSpacing(24),
        alignItems: "center",
        justifyContent: "center",
        minHeight: "fit-content",
        ...applyBGPattern({ url: asset.bgNoise, opacity: 0.6 }),
        [theme.breakpoints.down("md")]: {
          minHeight: "unset",
          padding: theme.boxSpacing(0),
        },
      }}
    >
      <Stack
        sx={{
          width: "70%",
          height: "85vh",
          maxHeight: 675,
          maxWidth: 1100,
          flexDirection: "row",
          gap: theme.gap(0),
          justifyContent: "space-between",
          background: theme.palette.gray[0],
          borderRadius: theme.radius[5],
          overflow: "hidden",
          boxShadow: `-12px -12px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}, 
          18px 18px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}`,
          [theme.breakpoints.only("md")]: {
            width: "90%",
          },
          [theme.breakpoints.down("md")]: {
            width: "100%",
            height: "100%",
            maxHeight: "unset",
            maxWidth: "unset",
            overflow: "auto",
            boxShadow: "none",
            flexDirection: "column",
            padding: theme.boxSpacing(0),
            borderRadius: 0,
            scrollSnapType: "y proximity",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          },
        }}
      >
        <Signup
          style={{
            container: {
              width: "50%",
              ...autoScroll().base,
              justifyContent: "flex-start",
              padding: theme.boxSpacing(18, 20),
              mdScreen: {
                height: "100svh",
                width: "80%",
                minHeight: "fit-content",
                justifyContent: "center",
                flex: "none",
                scrollSnapAlign: "start",
                padding: theme.boxSpacing(20, 10),
                overflow: "unset",
              },
              smScreen: {
                width: "100%",
              },
            },
          }}
        />
        <BGFadeCarousel
          slides={BG_SLIDER_DATA(translateTxtString)}
          autoPlay
          pauseOnHover
          interval={7000}
          style={{
            container: {
              width: "50%",
              height: "100%",
              borderRadius: 0,
              [theme.breakpoints.down("md")]: {
                width: "100%",
                height: "100svh",
                scrollSnapAlign: "start",
              },
            },
          }}
        />
      </Stack>
    </Stack>
  );
}
