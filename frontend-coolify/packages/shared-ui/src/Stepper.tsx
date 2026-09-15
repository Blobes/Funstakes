"use client";

import React from "react";
import { GenericStyle, IStep } from "@repo/core";
import { IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BasicTooltip } from "./Tooltips";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFramerVariants } from "@repo/helpers";

interface StepperProps<T> {
  steps: IStep<T>[];
  currStep: string;
  setCurrStep: (val: any) => void;
  style?: GenericStyle;
}

export const Stepper = <T,>({
  steps,
  currStep,
  setCurrStep,
  style = {},
}: StepperProps<T>) => {
  const theme = useTheme();
  const activeIndex = steps.findIndex((s) => s.name === currStep);

  if (activeIndex === -1) return null;
  const activeStep = steps[activeIndex];
  const prevStep = steps[activeIndex - 1];

  return (
    <Stack
      sx={{
        gap: theme.gap(18),
        width: "100%",
        alignItems: "center",
        ...style,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currStep}
          {...getFramerVariants("SLIDE_FADE", {
            duration: 0.3,
            ease: "easeInOut",
            xOffset: 10,
          })}
          style={{ display: "flex", width: "100%", justifyContent: "center" }}
        >
          {activeStep.element}
        </motion.div>
      </AnimatePresence>

      {activeStep.allowPrevious && activeIndex > 0 && (
        <BasicTooltip
          title={`Back to ${prevStep.label || String(prevStep.name).toLowerCase()}`}
        >
          <IconButton
            sx={{
              width: "48px",
              height: "48px",
              backgroundColor: theme.palette.gray.trans[1],
              transition: "background-color, stroke 0.3s ease",
              "& svg": { stroke: theme.palette.gray[300] },
              "&:hover": {
                "& svg": { stroke: theme.palette.gray[0] },
                backgroundColor: theme.palette.primary.dark,
              },
            }}
            onClick={() => {
              setCurrStep(prevStep.name);
              activeStep.action && activeStep.action();
            }}
          >
            <ArrowLeft size={28} />
          </IconButton>
        </BasicTooltip>
      )}
    </Stack>
  );
};
