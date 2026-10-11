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
import { useStaticTranslation } from "@repo/shared-hooks";
import { asset } from "@repo/assets";

export default function LoginPage() {
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const isSpaLoading = useGlobalStore((state) => state.isSpaLoading);
  const isCrossZoneLoading = useGlobalStore(
    (state) => state.isCrossZoneLoading,
  );
  const { openPopup } = usePopup();
  const { translateTxtString } = useStaticTranslation();

  const isTransitioning = isSpaLoading || isCrossZoneLoading;
  const showLoginForm = authStatus !== "AUTHENTICATED" || isTransitioning;

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        flexDirection: "row",
        gap: 0,
        alignItems: "center",
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
          scrollSnapType: "y proximity",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      }}
    >
      {showLoginForm ? (
        <>
          <Login />
          <TrendingPosts />
        </>
      ) : (
        <DisplayFeedbackUI
          type="ALREADY_LOGGED_IN"
          secondaryCta={{
            label: translateTxtString(AUTH_BUTTON_LABELS.logout),
            action: () => openPopup({ name: "CONFIRM_LOGOUT" }),
          }}
        />
      )}
    </Stack>
  );
}
