"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Login } from "./Login";
import { Stack } from "@mui/material";
import { applyBGPattern } from "@repo/helpers";
import { usePopup } from "@repo/features";
import { TrendingPosts } from "./TrendingPosts";
import { AUTH_BUTTON_LABELS, useGlobalStore } from "@repo/core";
import { DisplayFeedbackUI } from "@repo/shared-ui";
import { useStaticTranslation } from "../../../../packages/shared-hooks";

export default function LoginPage() {
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const { openPopup } = usePopup();
  const { translateTxtString } = useStaticTranslation();

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(30),
        minHeight: "fit-content",
        ...applyBGPattern(),
        [theme.breakpoints.down("md")]: {
          padding: theme.boxSpacing(0),
          minHeight: "unset",
        },
      }}
    >
      {authStatus === "UNAUTHENTICATED" || authStatus === "TEMPORARY" ? (
        <Stack
          sx={{
            width: "75%",
            flexDirection: "row",
            gap: theme.gap(0),
            justifyContent: "space-between",
            background: theme.palette.gray[0],
            borderRadius: theme.radius[5],
            overflow: "hidden",
            boxShadow: `-12px -12px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}, 
           18px 18px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}`,
            [theme.breakpoints.down(1180)]: {
              width: "90%",
            },
            [theme.breakpoints.down("md")]: {
              width: "100%",
              height: "100%",
              alignItems: "center",
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
          <Login
            style={{
              container: {
                width: "50%",
                borderRadius: 0,
                padding: theme.boxSpacing(24, 24),
                mdScreen: {
                  height: "100svh",
                  width: "70%",
                  minHeight: "fit-content",
                  scrollSnapAlign: "start",
                  padding: theme.boxSpacing(20, 10),
                },
                smScreen: {
                  width: "100%",
                },
              },
            }}
          />
          <TrendingPosts />
        </Stack>
      ) : (
        <DisplayFeedbackUI
          type="ALREADY_LOGGED_IN"
          secondaryCta={{
            label: translateTxtString(AUTH_BUTTON_LABELS.logout),
            action: () => openPopup("CONFIRM_LOGOUT"),
          }}
        />
      )}
    </Stack>
  );
}
