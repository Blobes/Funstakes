"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Box, Paper } from "@mui/material";
import { Stepper } from "./Stepper";
import { motion, AnimatePresence } from "framer-motion";
import { getFramerVariants } from "@repo/helpers";
import {
  COMMON_BUTTON_LABELS,
  BaseStyleObj,
  Guide,
  TourGuide,
} from "@repo/core";
import { Media } from "./media/view/Media";
import { AppButton } from "./Buttons";
import { TransText } from "./Text";

interface GuideProps {
  guides: Guide[];
  showTitle?: boolean;
  detailVisuals?: {
    id: string;
    icon?: React.ReactElement;
    textColor?: string;
  }[];
  containerStyle?: BaseStyleObj;
}

/**
 * Renders an inline validation helper guide checklist with support for real-time status changes.
 */
export const UIGuide = ({
  guides,
  showTitle = true,
  detailVisuals = [],
  containerStyle,
}: GuideProps) => {
  const theme = useTheme();

  return (
    <Stack
      gap={theme.gap(4)}
      sx={{ padding: theme.boxSpacing(6), ...containerStyle }}
    >
      {guides.map((guide) => {
        const hasMultiple = guide.guideDetails.length > 1;
        const useList = hasMultiple && guide.displayAsList;
        const containerComponent = useList ? "ul" : "div";

        return (
          <Stack key={guide.id || guide.title} gap={theme.gap(2)}>
            {showTitle && guide.title && (
              <TransText sx={{ ...theme.typography.text4, fontWeight: 600 }}>
                {guide.title}
              </TransText>
            )}

            <Box
              component={containerComponent}
              sx={{
                ...theme.typography.text5,
                margin: 0,
                padding: 0,
                color: theme.palette.gray[200],
                display: "flex",
                flexDirection: "column",
                gap: theme.gap(2),
                listStyle: "none",
              }}
            >
              {guide.guideDetails.map((item) => {
                const matchedVisual = detailVisuals.find(
                  (v) => v.id === item.id,
                );
                const activeColor =
                  matchedVisual && matchedVisual.textColor
                    ? matchedVisual.textColor
                    : "inherit";
                const activeIcon = matchedVisual ? matchedVisual.icon : null;

                return (
                  <Box
                    key={item.id}
                    component="div"
                    sx={{
                      display: "inline-flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: theme.gap(2),
                      color: activeColor,
                      "& svg": {
                        flex: "none",
                        stroke: activeColor,
                        marginTop: theme.gap(1),
                      },
                    }}
                  >
                    {/* Render active status icon or fallback to structural list bullet indicator */}
                    {activeIcon
                      ? activeIcon
                      : useList && (
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "16px",
                              height: "16px",
                              lineHeight: 1,
                              flexShrink: 0,
                              userSelect: "none",
                              "&::before": {
                                content: '"•"',
                                ...theme.typography.text1,
                                marginTop: theme.gap(2),
                              },
                            }}
                          />
                        )}

                    {typeof item.detail === "string" ? (
                      <TransText
                        component="p"
                        sx={{
                          ...theme.typography.text5,
                          width: "100%",
                          margin: 0,
                        }}
                      >
                        {item.detail}
                      </TransText>
                    ) : (
                      item.detail
                    )}
                  </Box>
                );
              })}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
};

interface UserTourGuideProps {
  steps: TourGuide[];
  onFinish?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * Interactive product walkthrough popup container powered by framer-motion transitions.
 */
export const UserTourGuide = ({
  steps,
  onFinish,
  open,
  setOpen,
}: UserTourGuideProps) => {
  const theme = useTheme();
  const [currStep, setCurrStep] = useState<string>(steps[0]?.name || "");

  const activeIndex = steps.findIndex((s) => s.name === currStep);
  const currentTourData = steps[activeIndex];

  if (!open || !currentTourData) return null;

  /**
   * Advances the guide forward or triggers final cleanup handlers on step termination.
   */
  const handleNext = () => {
    if (activeIndex < steps.length - 1) {
      setCurrStep(steps[activeIndex + 1].name);
    } else {
      setOpen(false);
      if (onFinish) onFinish();
    }
  };

  const formattedSteps = steps.map((step) => ({
    ...step,
    element: (
      <Stack key={step.name} gap={2} sx={{ width: "100%" }}>
        {step.media && (
          <Media
            _id={step.media._id}
            url={step.media.url}
            style={{
              itemWrapper: {
                base: {
                  width: "100%",
                  borderRadius: "8px",
                  overflow: "hidden",
                },
              },
            }}
          />
        )}
        <UIGuide
          showTitle={false}
          guides={[
            {
              id: `tour-guide-container-${step.name}`,
              title: step.label,
              guideDetails: [
                { id: `tour-detail-${step.name}`, detail: step.desc },
              ],
              displayAsList: false,
            },
          ]}
        />
      </Stack>
    ),
  }));

  const variants = getFramerVariants("POP", {
    duration: 0.4,
    scaleOffset: 0.8,
    ease: "easeOut",
  });

  return (
    <AnimatePresence mode="wait">
      <Paper
        key={currStep}
        variant="elevation"
        component={motion.div}
        initial={variants?.initial || { opacity: 0, scale: 0.8 }}
        animate={variants?.animate || { opacity: 1, scale: 1 }}
        exit={variants?.exit || { opacity: 0, scale: 0.8 }}
        transition={variants?.transition}
        elevation={16}
        sx={{
          position: "fixed",
          top: `${currentTourData.yPosition}%`,
          left: `${currentTourData.xPosition}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
          width: "350px",
          padding: 4,
          borderRadius: "20px",
          border: `1px solid ${theme.palette.gray.trans[1]}`,
          pointerEvents: "auto",
        }}
      >
        <Stack gap={4}>
          <Stepper
            steps={formattedSteps}
            currStep={currStep}
            setCurrStep={setCurrStep}
          />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <TransText
              sx={{
                ...theme.typography.text5,
                fontWeight: 500,
                opacity: 0.6,
              }}
            >
              {activeIndex + 1} / {steps.length}
            </TransText>

            <Stack direction="row" gap={1} alignItems="center">
              {activeIndex < steps.length - 1 && (
                <AppButton
                  variant="text"
                  onClick={() => setOpen(false)}
                  style={{
                    color: theme.palette.gray[200],
                    textTransform: "none",
                  }}
                >
                  <TransText {...COMMON_BUTTON_LABELS.skip} noComponent />
                </AppButton>
              )}
              <AppButton
                variant="contained"
                size="small"
                onClick={handleNext}
                style={{
                  width: "100%",
                }}
              >
                <TransText
                  {...COMMON_BUTTON_LABELS.active_view(
                    activeIndex === steps.length - 1 ? "Finish" : "Next",
                  )}
                  noComponent
                />
              </AppButton>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </AnimatePresence>
  );
};
