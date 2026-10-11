"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { UserPlus } from "lucide-react";
import { BaseStyleObj } from "@repo/core";

export interface FollowProps {
  onClick?: () => void;
  size?: number;
  sx?: BaseStyleObj;
}

export const FollowButton = ({ onClick, size = 24, sx }: FollowProps) => {
  return (
    <IconButton
      onClick={onClick}
      sx={{
        padding: 0,
        transition: "transform 0.2s ease-in-out",
        "&:hover": { transform: "scale(1.1)", background: "none" },
        ...sx,
      }}
    >
      <UserPlus size={size} />
    </IconButton>
  );
};
