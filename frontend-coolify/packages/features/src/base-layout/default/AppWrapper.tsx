"use client";

import React, { useRef } from "react";
import { Stack } from "@mui/material";
import { LeftNav } from "./LeftNav";
import { useTheme } from "@mui/material/styles";
import { BottomNav } from "./BottomNav";
import { RootUIContainer } from "@repo/shared-ui";
import { scrollBarStyle } from "@repo/helpers";
import { useMisc } from "@repo/shared-hooks";
import { useGlobalStore } from "@repo/core";
import { AppHeader } from "./Header";

interface WrapperProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const DefaultWrapper = ({
  children,
  hideHeader = false,
}: WrapperProps) => {
  const { isDesktop } = useMisc();
  const theme = useTheme();
  const authStatus = useGlobalStore((state) => state.authStatus);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <RootUIContainer>
      {/* Logged in & on desktop */}
      {authStatus === "AUTHENTICATED" && isDesktop && (
        <Stack
          sx={{
            height: "100%",
            gap: theme.gap(0),
            overflowY: "hidden",
            flexDirection: "column",
          }}
        >
          {!hideHeader && <AppHeader />}
          <Stack
            sx={{
              height: "100%",
              gap: theme.gap(0),
              overflowY: "hidden",
              overflowX: "auto",
              flexDirection: "row",
              width: "100%",
              ...scrollBarStyle(theme),
            }}
          >
            <LeftNav />
            {children}
          </Stack>
        </Stack>
      )}

      {/* Logged in and NOT on a desktop screen */}
      {authStatus === "AUTHENTICATED" && !isDesktop && (
        <Stack
          ref={scrollRef}
          sx={{
            height: "100%",
            gap: theme.gap(0),
            overflowY: "auto",
            justifyContent: "flex-start",
            alignItems: "center",
            flexDirection: "column",
            paddingBottom: theme.boxSpacing(23),
            ...scrollBarStyle(theme),
          }}
        >
          {!hideHeader && <AppHeader scrollRef={scrollRef} />}
          {children}
          <BottomNav scrollRef={scrollRef} />
        </Stack>
      )}

      {/* Not logged in on every screen size */}
      {authStatus !== "AUTHENTICATED" && (
        <Stack
          sx={{
            height: "100%",
            gap: theme.gap(0),
            overflowY: "auto",
            flexDirection: "column",
            [theme.breakpoints.down("md")]: {
              justifyContent: "flex-start",
              alignItems: "center",
            },
            ...scrollBarStyle(theme),
          }}
        >
          {!hideHeader && <AppHeader />}
          {children}
        </Stack>
      )}
    </RootUIContainer>
  );
};
