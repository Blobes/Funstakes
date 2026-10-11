"use client";

import React from "react";
import { Stack, Divider, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import { UserAvatar, AppButton, TransText, AppImage } from "@repo/shared-ui";
import { summarizeNum } from "@repo/helpers";
import { asset } from "@repo/assets";
import {
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  useGlobalStore,
} from "@repo/core";

export const ProfileCard = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  if (!authUser) return null;
  const { displayName, coverImage, email, followersCount, followingCount } =
    authUser;
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
      <AppImage
        src={coverImage || asset.marketingImg1}
        alt="User profile image cover"
        prioritize
        style={{ targetContent: { height: 130, width: "100%" } }}
      />

      <UserAvatar
        userInfo={authUser}
        toolTipValue="User profile"
        style={{
          border: `3px solid ${theme.palette.gray[0]}`,
          marginTop: theme.boxSpacing(-20),
          width: "70px",
          height: "70px",
        }}
      />
      <Stack
        sx={{
          width: "100%",
          textAlign: "center",
          padding: theme.boxSpacing(0, 12, 12, 12),
          alignItems: "center",
          justifyContent: "center",
          gap: theme.gap(1),
        }}
      >
        <TransText sx={theme.typography.text1} noWrap={true}>
          {displayName}
        </TransText>
        <TransText
          component="p"
          noWrap={true}
          sx={{ ...theme.typography.text4, color: theme.palette.gray[200] }}
        >
          {email}
        </TransText>
        <Divider />
        <Stack flexDirection="row" width="inherit">
          <Stack
            spacing={`${theme.gap(-5)}`}
            sx={{
              width: "inherit",
              borderRight: `1px solid ${theme.palette.gray.trans[1]}`,
            }}
          >
            <TransText sx={theme.typography.text1}>
              {summarizeNum(followersCount ?? 0)}
            </TransText>
            <TransText
              {...COMMON_FEEDBACK.followers}
              sx={{
                ...theme.typography.text4,
                color: theme.palette.gray[200],
              }}
            />
          </Stack>
          <Stack sx={{ width: "inherit" }} spacing={`${theme.gap(-5)}`}>
            <TransText sx={theme.typography.text1}>
              {summarizeNum(followingCount ?? 0)}
            </TransText>
            <TransText
              {...COMMON_FEEDBACK.following}
              sx={{ ...theme.typography.text4, color: theme.palette.gray[200] }}
            />
          </Stack>
        </Stack>
        <Divider />
        <AppButton
          variant="outlined"
          size="small"
          style={{
            alignSelf: "center",
            width: "100%",
            borderColor: theme.palette.gray.trans[2],
          }}
        >
          <TransText {...COMMON_BUTTON_LABELS.my_profile} noComponent />
        </AppButton>
      </Stack>
    </Stack>
  );
};
