"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { asset } from "@repo/assets";
import { BaseHeader, SVGWrapper } from "@repo/shared-ui";
import { ScrollRefProps } from "@repo/core";

export const Header: React.FC<ScrollRefProps> = ({ scrollRef }) => {
  const theme = useTheme();

  return (
    <BaseHeader scrollRef={scrollRef} hideOnPageScroll>
      {/* Right side elements */}
      <SVGWrapper
        src={asset.OfflineAvatar}
        size={34}
        preserveColor={true}
        sx={{
          [theme.breakpoints.down("md")]: {
            width: 28,
            height: 28,
          },
        }}
      />
    </BaseHeader>
  );
};
