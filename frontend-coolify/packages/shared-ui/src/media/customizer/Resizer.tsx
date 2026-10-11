"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";
import { useContentResizer } from "@repo/shared-hooks";
import { TransText } from "../../Text";

export interface ContentResizerProps {
  startValue?: number;
  increaseBy?: number;
  barsCount?: number;
  currentValue?: number;
  onResizeChange?: (value: number) => void;
}

const BarContainer = styled(Stack)(({ theme }) => ({
  alignItems: "flex-end",
  gap: theme.gap(2),
  padding: theme.boxSpacing(2),
  position: "absolute",
  right: 16,
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 10,
}));

const BarItem = styled(Box)<{ active?: boolean }>(({ theme, active }) => ({
  height: active ? 16 : 10,
  borderRadius: theme.radius.full,
  backgroundColor: active
    ? theme.fixedColors.gray50
    : theme.fixedColors.grayTrans(0.3, "light"),
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.common.white,
  },
}));

export const ContentResizer = ({
  startValue = 10,
  increaseBy = 5,
  barsCount = 5,
  currentValue,
  onResizeChange,
}: ContentResizerProps) => {
  const theme = useTheme();
  const { bars, handleBarSelect } = useContentResizer({
    startValue,
    increaseBy,
    barsCount,
    currentValue,
    onResizeChange,
  });

  return (
    <BarContainer>
      {bars.map((bar) => (
        <Stack
          key={bar.index}
          flexDirection="row"
          alignItems="center"
          gap={theme.gap(2)}
        >
          {bar.isActive && (
            <TransText
              component="span"
              sx={{
                ...theme.typography.text5,
                color: theme.fixedColors.gray50,
                fontWeight: 700,
                backgroundColor: theme.palette.gray[300],
                padding: theme.boxSpacing(0.5, 2),
                borderRadius: theme.radius[8],
              }}
            >
              {bar.value}px
            </TransText>
          )}
          <BarItem
            active={bar.isActive}
            onClick={() => handleBarSelect(bar.value)}
            sx={{ width: bar.width }}
          />
        </Stack>
      ))}
    </BarContainer>
  );
};
