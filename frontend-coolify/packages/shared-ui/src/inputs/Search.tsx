"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { InputBase, Stack } from "@mui/material";
import { Search as SearchIcon } from "lucide-react";
import { COMMON_INPUT } from "@repo/core";
import { useStaticTranslation } from "@repo/shared-hooks";
import { TransText } from "../Text";
import { InputEventHandlers, InputProps } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

const InputWrapper = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: theme.boxSpacing(4, 5),
  height: 40,
  transition: `width 0.3s ease-in-out, border 0.2s ease-in`,
  width: "28%",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
  // Border
  borderRadius: `${theme.radius.full}`,
  border: `1.5px solid transparent`,
  background: `linear-gradient(${theme.palette.gray[0]}) padding-box, 
  linear-gradient(to right, #7928ca, #0070f3, #00dfd8) border-box`,
  "&:hover": {
    border: `1.5px solid ${theme.palette.primary.dark}`,
  },
}));

export const SearchBar = ({
  onChange,
  onDisabledClick,
  focusResizeWidth = true,
  disabled,
  style,
  placeholder,
}: InputProps & InputEventHandlers) => {
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  const renderInputField = () => (
    <InputWrapper
      sx={{
        ...style,
        ...(focusResizeWidth && {
          "&:focus-within": {
            width:
              style?.width > 20 ? `calc(${style?.width - 5}%)` : style?.width,
          },
        }),
      }}
    >
      <SearchIcon size="20" />
      <InputBase
        placeholder={
          placeholder ?? translateTxtString(COMMON_INPUT.placeholder.explore)
        }
        inputProps={{ "aria-label": "search" }}
        onChange={onChange}
        disabled={disabled}
        sx={{
          ...theme.typography.text4,
          width: "100%",
        }}
      />
    </InputWrapper>
  );

  return disabled ? (
    <DisabledClickWrapper onClick={onDisabledClick}>
      {renderInputField()}
    </DisabledClickWrapper>
  ) : (
    renderInputField()
  );
};

export const SearchContainer = () => {
  const theme = useTheme();
  return (
    <InputWrapper sx={{ cursor: "pointer" }}>
      <SearchIcon size="20" />
      <TransText
        component="p"
        sx={{
          ...theme.typography.text4,
          color: theme.palette.gray[200],
          width: "100%",
        }}
      >
        Search & explore
      </TransText>
    </InputWrapper>
  );
};
