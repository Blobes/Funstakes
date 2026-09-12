"use client";

import React, { useState } from "react";
import { Box, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ChevronDown } from "lucide-react";
import { GenericStyle } from "@repo/core";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  subtitle?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpandedIds?: string[];
  style?: {
    container?: GenericStyle;
    item?: GenericStyle;
    summary?: GenericStyle;
    details?: GenericStyle;
  };
  expandIcon?: React.ReactNode;
  expandIconSize?: number;
}

/**
 * Clean accordion component built with flat MUI Box and Stack layout structures.
 */
export const Accordion = ({
  items,
  allowMultiple = false,
  defaultExpandedIds = [],
  style,
  expandIcon,
  expandIconSize = 20,
}: AccordionProps) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string[]>(defaultExpandedIds);
  const isExpanded = (id: string) => expanded.includes(id);

  /**
   * Toggles the target item's expanded state.
   */
  const handleToggle = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (allowMultiple) {
      setExpanded((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setExpanded((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  /**
   * Renders the standard chevron or provided expand icon with active rotation state.
   */
  const renderExpandIcon = (expandedState: boolean) => {
    if (expandIcon) return expandIcon;
    return (
      <ChevronDown
        size={expandIconSize}
        style={{
          transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: expandedState ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    );
  };

  return (
    <Stack sx={{ width: "100%", gap: theme.gap(4), ...style?.container }}>
      {items.map((item) => {
        const expandedState = isExpanded(item.id);

        return (
          <Stack
            key={item.id}
            sx={{
              width: "100%",
              overflow: "hidden",
              opacity: item.disabled ? 0.6 : 1,
              ...style?.item,
            }}
          >
            {/* Summary / Header */}
            <Box
              role="button"
              tabIndex={item.disabled ? -1 : 0}
              aria-expanded={expandedState}
              aria-disabled={item.disabled}
              onClick={() => handleToggle(item.id, item.disabled)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(item.id, item.disabled);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: theme.boxSpacing(8),
                gap: theme.gap(4),
                cursor: item.disabled ? "not-allowed" : "pointer",
                borderRadius: theme.radius[2],
                backgroundColor: theme.palette.gray.trans[1],
                "& svg": { stroke: theme.palette.gray[300] },
                ...style?.summary,
              }}
            >
              {item.icon && item.icon}

              <Stack sx={{ gap: theme.gap(2) }}>
                {item.title}
                {item.subtitle && item.subtitle}
              </Stack>

              {renderExpandIcon(expandedState)}
            </Box>

            {/* Flat Collapsible Content Container */}
            <Box
              sx={{
                display: "grid",
                gridTemplateRows: expandedState ? "1fr" : "0fr",
                transition:
                  "grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
              }}
            >
              <Stack
                sx={{
                  minHeight: 0,
                  gap: theme.gap(4),
                  visibility: expandedState ? "visible" : "hidden",
                  cursor: "pointer",
                  transition: " visibility 0.2s ease",
                  ...style?.details,
                }}
              >
                {item.content}
              </Stack>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
};
