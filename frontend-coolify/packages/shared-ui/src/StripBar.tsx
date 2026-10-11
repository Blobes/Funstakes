"use client";

import React, { Fragment } from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BaseStyleObj } from "@repo/core";
import { TransText } from "./Text";

interface Item {
  text?: string;
  element?: React.ReactNode;
}

interface StripProps {
  items: Item[];
  style?: BaseStyleObj;
}

export const Strip = ({ items = [], style = {} }: StripProps) => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        gap: theme.gap(4),
        flexDirection: "row",
        alignItems: "center",
        ...style,
      }}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          <TransText
            sx={{
              ...theme.typography.text3,
              display: "flex",
              alignItems: "center",
              gap: theme.gap(2),
              color: theme.palette.gray[200],
              textAlign: "center",
            }}
          >
            {item.element && item.element}
            {item.text && item.text}
          </TransText>

          {index < items.length - 1 && (
            <Box
              sx={{
                width: "3px",
                height: "3px",
                backgroundColor: theme.palette.gray[200],
                borderRadius: theme.radius["full"],
              }}
            />
          )}
        </Fragment>
      ))}
    </Stack>
  );
};
