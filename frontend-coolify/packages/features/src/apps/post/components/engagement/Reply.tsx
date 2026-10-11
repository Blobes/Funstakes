"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { MessageCircle } from "lucide-react";
import { BaseStyleObj } from "@repo/core";

export interface ReplyProps {
  onClick?: () => void;
  size?: number;
  style?: BaseStyleObj;
}

export const ReplyButton = ({ onClick, size = 24, style }: ReplyProps) => (
  <IconButton
    onClick={onClick}
    sx={{
      padding: 0,
      borderRadius: 0,
      transition: "transform 0.3s ease-in-out",
      "&:hover": {
        transform: "scale(1.08)",
        background: "none",
      },
      ...style,
    }}
  >
    <MessageCircle size={size} />
  </IconButton>
);
