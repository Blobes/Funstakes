"use client";

import React from "react";
import { AppBar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc, usePageScroll } from "@repo/shared-hooks";
import { asset } from "@repo/assets";
import Image from "next/image";
import { SVGWrapper } from "@repo/shared-ui";

interface AppHeaderProps {
  scrollRef?: React.RefObject<HTMLElement | null>;
}
export const Header: React.FC<AppHeaderProps> = ({ scrollRef }) => {
  const { isDesktop } = useMisc();
  const { scrollDir } = usePageScroll(scrollRef);
  const theme = useTheme();

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AppBar
      position="sticky"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        zIndex: 100,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.gap(6),
        backdropFilter: "blur(24px)",
        ...(!isDesktop && {
          transform:
            scrollDir === "down" ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.3s ease-in-out",
        }),
      }}
    >
      {/* Logo */}
      <Image
        src={asset.appLogoSymbol}
        alt="logo"
        width={34}
        height={34}
        style={{
          borderRadius: `${theme.radius.full}`,
        }}
      />

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
    </AppBar>
  );
};
