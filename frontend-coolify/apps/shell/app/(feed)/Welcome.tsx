"use client";

import React from "react";
import { AppButton, Footer, TransText } from "@repo/shared-ui";
import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  LISTS,
} from "@repo/core";

export const Welcome = () => {
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const { FOOTER_NAV_LIST } = LISTS(translateTxtString);
  const theme = useTheme();

  return (
    <>
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          minHeight: "fit-content",
          padding: theme.boxSpacing(12),
        }}
      >
        <TransText
          {...COMMON_FEEDBACK.join_funstakes_headline}
          component="h5"
          sx={{ ...theme.typography.h5, textAlign: "center" }}
        />
        <AppButton
          variant="contained"
          href={CLIENT_ROUTES.signup.path}
          onClick={() => navigateTo(CLIENT_ROUTES.signup)}
        >
          <TransText {...COMMON_BUTTON_LABELS.get_started} noComponent />
        </AppButton>
      </Stack>
      <Footer navList={FOOTER_NAV_LIST} />
    </>
  );
};
