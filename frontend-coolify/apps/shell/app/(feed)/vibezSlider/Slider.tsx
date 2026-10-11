"use client";

import React from "react";
import { Stack, FormControl } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  UserAvatar,
  ResponsiveTextarea,
  TransText,
} from "@repo/shared-ui";
import { Image, Play } from "lucide-react";
import { POST_BUTTON_LABELS, useGlobalStore } from "@repo/core";

export const UpdatesCarousel = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);
  if (!authUser) {
    return null;
  }
  const { displayName } = authUser;
  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray.trans[1],
        borderRadius: theme.radius[8],
        flexDirection: "column",
        padding: theme.boxSpacing(6),
        gap: theme.gap(10),
        [theme.breakpoints.down("md")]: {
          margin: theme.boxSpacing(6),
        },
      }}
    >
      {/* Create field */}
      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyItems: "flex-start",
          gap: theme.gap(2),
        }}
      >
        <UserAvatar
          userInfo={authUser}
          style={{
            width: "26px",
            height: "26px",
          }}
        />
        <FormControl fullWidth>
          <ResponsiveTextarea
            placeholder={`${displayName} express yourself today...`}
          />
        </FormControl>
      </Stack>
      {/* Actions */}
      <Stack
        sx={{
          paddingLeft: theme.boxSpacing(3),
          borderRadius: theme.radius[8],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <AppButton
          variant="contained"
          size="small"
          style={{
            backgroundColor: theme.palette.gray.trans[1],
            "&:hover": {
              backgroundColor: theme.palette.gray.trans[2],
            },
          }}
        >
          <Image size={20} />{" "}
          <TransText {...POST_BUTTON_LABELS.add_image} noComponent />
        </AppButton>
        <AppButton
          variant="contained"
          size="small"
          style={{
            backgroundColor: theme.palette.gray.trans[1],
            "&:hover": {
              backgroundColor: theme.palette.gray.trans[2],
            },
          }}
        >
          <Play size={20} />{" "}
          <TransText {...POST_BUTTON_LABELS.add_video} noComponent />
        </AppButton>
      </Stack>
    </Stack>
  );
};
