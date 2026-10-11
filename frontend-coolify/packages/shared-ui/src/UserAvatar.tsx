"use client";

import React from "react";
import { Avatar, IconButton } from "@mui/material";
import { getImageFromText, getInitialsAndColors } from "@repo/helpers";
import { BasicTooltip } from "./Tooltips";
import { BaseStyleObj, IUser } from "@repo/core";
import { useTheme } from "@mui/material/styles";
import { asset } from "@repo/assets";

interface UserAvatarProps {
  userInfo: IUser | null;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  url?: string;
  style?: BaseStyleObj;
  toolTipValue?: string;
}

export const UserAvatar = ({
  userInfo,
  onClick,
  url,
  style = { width: "30px", height: "30px" },
  toolTipValue,
}: UserAvatarProps) => {
  const theme = useTheme();

  if (!userInfo) {
    return null;
  }
  const { displayName, profileImage } = userInfo;
  const textAvatar = getInitialsAndColors(displayName);
  const { marginTop, marginLeft, width, ...otherStyles } = style;
  const dynamicFontSize = `calc(${width || "30px"} * 0.45)`;

  const defaultAvatars = [
    asset.avatar1,
    asset.avatar2,
    asset.avatar3,
    asset.avatar4,
    asset.avatar5,
    asset.avatar6,
  ];
  const imageAvatar =
    profileImage || getImageFromText(displayName, defaultAvatars).imageUrl;

  return (
    <BasicTooltip title={toolTipValue} sx={{ borderRadius: theme.radius[12] }}>
      <IconButton
        {...(url ? { href: url } : {})}
        onClick={onClick}
        sx={{
          borderRadius: theme.radius.full,
          padding: theme.boxSpacing(2),
          ...(marginLeft && { marginLeft }),
          ...(marginTop && { marginTop }),
        }}
        aria-label="User profile"
      >
        <Avatar
          sx={{
            color: textAvatar.textColor,
            bgcolor: textAvatar.bgColor,
            borderRadius: theme.radius.full,
            fontSize: dynamicFontSize,
            fontWeight: 600,
            ...otherStyles,
          }}
          alt={displayName}
          {...(imageAvatar
            ? { src: imageAvatar }
            : { children: textAvatar.initials })}
        />
      </IconButton>
    </BasicTooltip>
  );
};
