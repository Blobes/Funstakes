"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Stack, Divider, ClickAwayListener } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BaseStyleObj,
  BaseStyleProps,
  ITranslation,
  ScrollRefProps,
  StaticContentSection,
} from "@repo/core";
import { AnchorLink } from "./Buttons";
import { TransText } from "./Text";
import { Accordion, AccordionItem } from "./Accordion";
import { autoScroll, scrollBarStyle } from "@repo/helpers";
import { usePageScroll } from "@repo/shared-hooks";

export interface TableOfContentsProps extends ScrollRefProps {
  title: ITranslation;
  sections: StaticContentSection[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  shouldFloat?: boolean;
  hideOnPageBottom?: boolean;
  hideSelectorElement?: string;
  bottomThresholdPx?: number;
  onExpandedChange?: (isExpanded: boolean) => void;
  style?: BaseStyleProps;
}

/**
 * Reusable navigation table of contents supporting flat and accordion modes.
 */
export const PageContentTable: React.FC<TableOfContentsProps> = ({
  title,
  sections,
  isCollapsible = false,
  defaultExpanded = false,
  shouldFloat = true,
  hideOnPageBottom,
  hideSelectorElement,
  bottomThresholdPx,
  scrollRef,
  onExpandedChange,
  style = {},
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const isCollapsed = shouldFloat && !isExpanded;
  const ref = useRef<HTMLDivElement>(null);

  const { isNearPageBottom, isSelectorVisible } = usePageScroll({
    ref: scrollRef,
    trackPageBottom: shouldFloat && !!hideOnPageBottom,
    bottomThresholdPx,
    trackSelector:
      shouldFloat && hideSelectorElement ? hideSelectorElement : null,
  });

  const hideFloating = shouldFloat
    ? hideSelectorElement
      ? isSelectorVisible
      : hideOnPageBottom
        ? isNearPageBottom
        : false
    : false;

  /**
   * Handles expanding/collapsing the accordion state and emits changes.
   */
  const handleToggleState = useCallback(
    (nextState: boolean) => {
      setIsExpanded(nextState);
      onExpandedChange?.(nextState);
    },
    [onExpandedChange],
  );

  /**
   * Handles collapse trigger when clicking outside or clicking an item link.
   */
  const collapseTable = useCallback(() => {
    if (isCollapsible && isExpanded) {
      handleToggleState(false);
    }
  }, [isCollapsible, isExpanded, handleToggleState]);

  const itemStyle: BaseStyleObj = {
    ...theme.typography.text3,
    width: "100%",
    color: theme.palette.gray[300],
    "&:hover": {
      color: theme.palette.primary.dark,
      textDecoration: "underline",
      fontWeight: 600,
    },
    ...style.item,
  };

  const containerStyle: BaseStyleObj = {
    width: isCollapsed ? "fit-content" : "90vw",
    borderRadius: isCollapsed ? theme.radius.full : theme.radius[16],
    border: `1px solid ${theme.palette.gray.trans[1]}`,
    maxWidth: 320,
    overflow: "hidden",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ...(shouldFloat && {
      position: "fixed",
      maxHeight: "65vh",
      background: theme.palette.gray[0],
      zIndex: 1000,
      bottom: 20,
      right: 20,
      boxShadow: `0px 8px 24px -4px ${theme.palette.gray.trans[2]}`,
    }),
    ...style.itemWrapper,
  };

  /**
   * Renders the ordered link list with dividing borders.
   */
  const renderItems = () => (
    <Stack
      sx={{
        gap: theme.gap(8),
        padding: theme.boxSpacing(10),
        ...autoScroll().base,
        ...scrollBarStyle(theme),
      }}
    >
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          {index > 0 && (
            <Divider
              sx={{
                borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                margin: 0,
              }}
            />
          )}
          <AnchorLink
            href={`#${section.id}`}
            style={itemStyle}
            onClick={collapseTable}
          >
            <TransText {...section.title} noComponent />
          </AnchorLink>
        </React.Fragment>
      ))}
    </Stack>
  );

  const accordionItems: AccordionItem[] = useMemo(
    () => [
      {
        id: "table-of-contents",
        title: (
          <TransText
            {...title}
            sx={{
              ...theme.typography.text3,
              fontWeight: 600,
              color: theme.palette.gray[300],
            }}
          />
        ),
        content: renderItems(),
      },
    ],
    [title, sections, theme, itemStyle, isExpanded],
  );

  if (hideFloating) return null;

  if (isCollapsible) {
    return (
      <ClickAwayListener onClickAway={collapseTable}>
        <Accordion
          ref={ref}
          items={accordionItems}
          expandedIds={isExpanded ? ["table-of-contents"] : []}
          onToggle={(_, __, expandedState) => {
            handleToggleState(expandedState);
          }}
          style={{
            itemWrapper: { ...containerStyle },
            item: { gap: 0, width: isCollapsed ? "min-content" : "100%" },
            header: {
              wrapper: {
                background: "none",
                "&:hover": {
                  background: theme.palette.gray.trans.overlay(0.06),
                },
                width: isCollapsed ? "max-content" : "100%",
                justifyContent: !isCollapsed ? "space-between" : "center",
                padding: isCollapsed
                  ? theme.boxSpacing(6, 8)
                  : theme.boxSpacing(8, 10),
                borderBottom:
                  shouldFloat && isExpanded
                    ? `1px solid ${theme.palette.gray.trans[1]}`
                    : "none",
                borderRadius: 0,
                transition: `width 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.3s cubic-bezier(0.4, 0, 0.2, 1)
                    `,
              },
              element: {
                flex: "none",
              },
            },
          }}
        />
      </ClickAwayListener>
    );
  }

  return (
    <Stack component="nav" aria-label="Table of contents" sx={containerStyle}>
      <TransText
        {...title}
        sx={{
          ...theme.typography.text2,
          fontWeight: 600,
          color: theme.palette.gray[300],
        }}
      />
      {renderItems()}
    </Stack>
  );
};
