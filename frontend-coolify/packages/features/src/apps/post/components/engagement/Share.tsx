"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { Send } from "lucide-react";
import { BaseStyleObj } from "@repo/core";

export interface ShareProps {
  onClick?: () => void;
  size?: number;
  sx?: BaseStyleObj;
}

export const ShareButton = ({ onClick, size = 24, sx }: ShareProps) => (
  <IconButton
    onClick={onClick}
    sx={{
      padding: 0,
      transition: "transform 0.2s ease-in-out",
      "&:hover": { transform: "scale(1.1)", background: "none" },
      ...sx,
    }}
  >
    <Send size={size} />
  </IconButton>
);
