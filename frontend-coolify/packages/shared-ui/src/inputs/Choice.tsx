"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Radio,
  Stack,
  Switch,
} from "@mui/material";
import { BasicTooltip } from "../Tooltips";
import { Check, CircleQuestionMark } from "lucide-react";
import { InputEventHandlers, InputProps } from "./Dynamic";
import { DisabledClickWrapper } from "../ElementTap";

export interface ChoiceInputProps extends InputProps, InputEventHandlers {
  choiceType?: "checkbox" | "radio" | "switch";
  checked?: boolean;
  choiceValue?: string | number | boolean;
  checkIconSize?: string | number;
  switchIcon?: React.ReactNode;
  switchCheckedIcon?: React.ReactNode;
  onChoiceChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => void;
}

/**
 * Renders a configurable Checkbox, Radio, or Switch field integrated with tooltips and form helper states.
 */
export const ChoiceInput = ({
  choiceType = "checkbox",
  id,
  label,
  checked = false,
  choiceValue,
  checkIconSize = 18,
  switchIcon,
  switchCheckedIcon,
  helperText,
  disabled = false,
  error = false,
  required = false,
  tooltipGuide,
  onChoiceChange,
  onDisabledClick,
  style,
}: ChoiceInputProps) => {
  const theme = useTheme();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChoiceChange?.(event, event.target.checked);
  };

  const controlSx = {
    padding: theme.boxSpacing(2.5),
    color: error ? theme.palette.error.main : theme.palette.gray[200],
  };

  /**
   * Renders thumb icon for custom switch layout matching ThemeSwitcher style.
   */
  const renderSwitchIcon = (isChecked: boolean) => {
    const customIcon = isChecked ? switchCheckedIcon : switchIcon;

    return (
      <Stack
        sx={{
          width: 28,
          height: 28,
          borderRadius: theme.radius.full,
          backgroundColor: isChecked
            ? theme.palette.primary.dark
            : theme.palette.gray[200],
          padding: theme.boxSpacing(1),
          alignItems: "center",
          justifyContent: "center",
          "& svg": {
            width: "100%",
            height: "100%",
            stroke: theme.fixedColors.gray50,
            strokeWidth: 3,
          },
        }}
      >
        {customIcon ?? (isChecked ? <Check /> : null)}
      </Stack>
    );
  };

  const renderCheckIcon = (
    type: "check" | "radio" | "radio-check" = "check",
  ) => (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(1.5),
        width: checkIconSize,
        height: checkIconSize,
        border: `2px solid ${checked ? theme.palette.primary.main : theme.palette.gray[200]}`,
        borderRadius: type === "check" ? theme.radius[1] : theme.radius.full,
        backgroundColor:
          checked && type !== "radio"
            ? theme.palette.primary.main
            : "transparent",
        "& svg": {
          stroke: theme.fixedColors.gray50,
          strokeWidth: 4,
        },
      }}
    >
      {checked &&
        (type === "radio" ? (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              backgroundColor: theme.palette.primary.main,
              borderRadius: "inherit",
            }}
          />
        ) : (
          <Check size={12} />
        ))}
    </Stack>
  );

  const renderControl = () => {
    switch (choiceType) {
      case "radio":
        return (
          <Radio
            id={id}
            checked={checked}
            value={choiceValue}
            disabled={disabled}
            onChange={handleChange}
            sx={controlSx}
            icon={renderCheckIcon("radio")}
            checkedIcon={renderCheckIcon("radio")}
          />
        );
      case "switch":
        return (
          <Switch
            id={id}
            checked={checked}
            value={choiceValue}
            disabled={disabled}
            onChange={handleChange}
            icon={renderSwitchIcon(false)}
            checkedIcon={renderSwitchIcon(true)}
            sx={{
              width: 50,
              height: 28,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: disabled ? 0.5 : 1,

              // Switch Container
              "& .MuiSwitch-track": {
                borderRadius: theme.radius.full,
                backgroundColor: "transparent",
                border: `1px solid ${theme.palette.gray[100]}`,
                opacity: 1,
                transition: theme.transitions.create(
                  ["background-color", "border-color"],
                  { duration: 200 },
                ),
              },
              "&:hover .MuiSwitch-track": {
                backgroundColor: theme.palette.gray.trans[1],
              },

              // Switch handle
              "& .MuiSwitch-switchBase": {
                transitionDuration: "150ms",
                padding: theme.boxSpacing(1),
                top: "unset",
                left: 4,
                "&.Mui-checked": {
                  transform: "translateX(12px)",
                  "& + .MuiSwitch-track": {
                    backgroundColor: theme.fixedColors.pTrans,
                    borderColor: theme.palette.primary.main,
                    opacity: 1,
                  },
                },
                "& .MuiSwitch-input": {
                  width: "100%",
                  left: 0,
                },
                "& .MuiStack-root": { width: 26, height: 18 },
              },
            }}
          />
        );
      case "checkbox":
      default:
        return (
          <Checkbox
            id={id}
            checked={checked}
            value={choiceValue}
            disabled={disabled}
            onChange={handleChange}
            sx={{
              borderRadius: theme.radius[2],
              ...controlSx,
            }}
            icon={renderCheckIcon("check")}
            checkedIcon={renderCheckIcon("check")}
          />
        );
    }
  };

  const renderInputField = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        ...style?.container?.base,
        [theme.breakpoints.down("md")]: {
          ...style?.container?.smallScreen,
        },
      }}
    >
      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.gap(2),
          ...style?.content,
        }}
      >
        <FormControlLabel
          control={renderControl()}
          required={required}
          label={
            label ? (
              <span
                style={{
                  ...theme.typography.text4,
                  color: error
                    ? theme.palette.error.main
                    : theme.palette.gray[300],
                }}
              >
                {label}
              </span>
            ) : null
          }
          disabled={disabled}
          sx={{
            width: "100%",
            minWidth: "fit-content",
            gap: theme.gap(2),
            margin: 0,
          }}
        />

        {tooltipGuide && (
          <BasicTooltip title={tooltipGuide}>
            <Box
              sx={{
                display: "flex",
                cursor: "pointer",
                borderRadius: theme.radius.full,
                alignSelf: "center",
                flex: "none",
                padding: theme.boxSpacing(2),
                "&:hover": {
                  backgroundColor: theme.palette.gray.trans[1],
                },
              }}
            >
              <CircleQuestionMark size={18} />
            </Box>
          </BasicTooltip>
        )}
      </Stack>

      {helperText && (
        <FormHelperText
          error={error}
          sx={{
            marginLeft: theme.spacing(1),
            marginTop: 0,
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );

  return disabled ? (
    <DisabledClickWrapper onClick={onDisabledClick}>
      {renderInputField()}
    </DisabledClickWrapper>
  ) : (
    renderInputField()
  );
};
