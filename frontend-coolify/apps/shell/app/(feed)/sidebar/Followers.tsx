"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { FollowerCard } from "./FollowerCard";
import { ProgressIcon, DisplayFeedbackUI } from "@repo/shared-ui";
import { UserMinus } from "lucide-react";
import { useUser } from "@repo/features";
import { COMMON_FEEDBACK, useGlobalStore } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";

export const Followers = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);
  const { translateTxtString } = useStaticTranslation();
  const {
    followers,
    isLoading,
    followersMessage: message,
  } = useUser(authUser?._id);

  return (
    <>
      {isLoading ? (
        <Stack
          sx={{
            padding: theme.boxSpacing(12, 4),
            alignItems: "center",
          }}
        >
          <ProgressIcon options={{ size: 30 }} />
        </Stack>
      ) : authUser && followers && followers.length < 1 ? (
        <DisplayFeedbackUI
          type="UNKNOWN"
          tagline={
            message ||
            translateTxtString(COMMON_FEEDBACK.user_no_follower_tagline)
          }
          icon={<UserMinus />}
        />
      ) : followers && followers.length > 0 ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            gap: "unset",
            height: "fit-content",
            padding: theme.boxSpacing(0),
          }}
        >
          {followers.map((follower) => {
            return <FollowerCard key={follower._id} follower={follower} />;
          })}
        </Stack>
      ) : (
        <DisplayFeedbackUI
          type="UNKNOWN"
          tagline={
            message || translateTxtString(COMMON_FEEDBACK.server_error_tagline)
          }
          icon={<UserMinus />}
        />
      )}
    </>
  );
};
