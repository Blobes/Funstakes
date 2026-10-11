"use client";

import React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const RecentMedia = () => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        backgroundColor: theme.fixedColors.pTrans,
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: theme.radius[8],
        overflow: "hidden",
        height: "fit-content",
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      Get all the recently viewed media
    </Stack>
  );
};
