"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";
import { ImageFilterType } from "@repo/core";
import { useFilterMode } from "@repo/shared-hooks";
import { TransText } from "../../Text";

export interface FilterModeProps {
  activeFilter: ImageFilterType;
  mediaUrl: string;
  onFilterChange: (filter: ImageFilterType) => void;
}

const FilterRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.gap(3),
  overflowX: "auto",
  padding: theme.boxSpacing(2, 4),
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 8,
  maxWidth: "90%",
  backgroundColor: theme.palette.gray[300],
  borderRadius: theme.radius.full,
  backdropFilter: "blur(10px)",
}));

export const FilterMode = ({
  activeFilter,
  mediaUrl,
  onFilterChange,
}: FilterModeProps) => {
  const theme = useTheme();
  const { FILTER_LIST, handleSelectFilter } = useFilterMode({
    activeFilter,
    onFilterChange,
  });

  return (
    <FilterRow>
      {FILTER_LIST.map((item) => {
        const isSelected = item.type === activeFilter;
        return (
          <Stack
            key={item.type}
            alignItems="center"
            onClick={() => handleSelectFilter(item.type)}
            sx={{ cursor: "pointer" }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: theme.radius[8],
                overflow: "hidden",
                border: isSelected
                  ? `2px solid ${theme.palette.primary.main}`
                  : "2px solid transparent",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <img
                src={mediaUrl}
                alt={item.label}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: item.filterStyle,
                }}
              />
            </Box>
            <TransText
              sx={{
                ...theme.typography.text4,
                color: isSelected
                  ? theme.palette.gray[0]
                  : theme.palette.gray[100],
                marginTop: theme.boxSpacing(1),
              }}
            >
              {item.label}
            </TransText>
          </Stack>
        );
      })}
    </FilterRow>
  );
};
