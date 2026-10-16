"use client";

import React, { Fragment } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BaseStyleObj,
  BaseStyleProps,
  IMenuItem,
  ITopic,
  ListType,
  POST_INFO,
} from "@repo/core";
import { matchPaths, summarizeNum } from "@repo/helpers";
import { usePathname } from "next/navigation";
import { AnchorLink } from "./Buttons";
import { TransText } from "./Text";

/**
 * Props for the reusable nav renderer
 */
export interface RenderListProps<T extends IMenuItem> {
  list: T[];
  listType?: ListType;
  onItemClick?: (item?: IMenuItem & T) => void;
  style?: BaseStyleProps;
  activeItems?: (string | number)[];
  displayActiveState?: boolean;
  hidePrefixes?: boolean;
  hideSuffixes?: boolean;
}

export const RenderItemList = <T extends IMenuItem>({
  list,
  listType = ListType.DEFAULT,
  onItemClick,
  style = {},
  activeItems = [],
  displayActiveState = true,
  hidePrefixes = false,
  hideSuffixes = false,
}: RenderListProps<T>) => {
  const theme = useTheme();
  const pathname = usePathname();

  // Base container layout styles for each wrapper item
  const itemWrapperStyle: BaseStyleObj = {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    cursor: "pointer",
    gap: theme.gap(3),
    padding: theme.boxSpacing(2, 4),
    borderRadius: theme.radius.full,
    transition: "all 0.2s ease",
    textDecoration: "none",
    "&:hover": {
      backgroundColor: theme.palette.gray.trans[1],
      outline: "none",
    },
    ...style?.itemWrapper,
    [theme.breakpoints.down("sm")]: {
      ...style.itemWrapper?.smScreen,
    },
  };

  // Typography styles for child text elements
  const itemStyle: BaseStyleObj = {
    ...theme.typography.text3,
    fontWeight: 500,
    color: theme.palette.gray[300],
    ...style.item,
    smScreen: {
      ...style.item?.smScreen,
    },
  };

  const checkIsActive = (item: T): boolean => {
    if (!activeItems || activeItems.length === 0) return false;
    const lowercasedActiveItems = activeItems.map((val) =>
      val.toString().toLowerCase(),
    );
    return Object.values(item).some(
      (val) =>
        typeof val === "string" &&
        lowercasedActiveItems.includes(val.toLowerCase()),
    );
  };

  const renderItem = (item: T) => {
    switch (listType) {
      case "TOPICS":
        return (
          <TopicItem
            title={item.title}
            postCount={(item as T & ITopic).postCount}
            prefix={item.prefix}
            style={itemStyle}
          />
        );
      default:
        return (
          <BaseItem
            title={item.title}
            prefix={!hidePrefixes ? item.prefix : undefined}
            suffix={!hideSuffixes ? item.suffix : undefined}
            style={itemStyle}
          />
        );
    }
  };

  return (
    <Stack
      sx={{
        gap: theme.gap(4),
        minHeight: "fit-content",
        flexDirection: "row",
        ...style?.listWrapper,
      }}
    >
      {list.map((item, index) => {
        const isLink = item.type === "LINK" || (!item.type && item.url);
        const isActive = isLink
          ? matchPaths(pathname, item.url ?? "")
          : checkIsActive(item);

        const handleClick = () => {
          item.action?.();
          onItemClick?.(item);
        };

        if (item.type === "COMPONENT")
          return <Fragment key={index}>{item.component}</Fragment>;

        const Wrapper = (isLink ? AnchorLink : Stack) as React.ElementType;

        return (
          <Wrapper
            key={index}
            {...(isLink ? { href: item.url ?? "" } : {})}
            onClick={handleClick}
            sx={{
              backgroundColor:
                displayActiveState && isActive
                  ? theme.palette.gray.trans[1]
                  : "transparent",
              ...itemWrapperStyle,
            }}
          >
            {renderItem(item)}
          </Wrapper>
        );
      })}
    </Stack>
  );
};

interface BaseItemProps extends IMenuItem {
  style?: BaseStyleObj;
}
const BaseItem = ({ title, prefix, suffix, style }: BaseItemProps) => {
  const theme = useTheme();
  return (
    <>
      <Stack
        sx={{
          //  width: "100%",
          flexDirection: "row",
          alignItems: "center",
          gap: style?.gap ?? theme.gap(4),
          flex: 1,
          [theme.breakpoints.down("sm")]: {
            gap: style?.smScreen?.gap,
          },
        }}
      >
        {prefix}
        {title && (
          <TransText
            sx={{
              ...style,
              [theme.breakpoints.down("sm")]: {
                ...style?.smScreen,
              },
            }}
          >
            {title}
          </TransText>
        )}
      </Stack>
      {suffix}
    </>
  );
};

const TopicItem = ({
  title,
  prefix: element,
  style,
  postCount,
}: BaseItemProps & ITopic) => {
  const theme = useTheme();
  return (
    <>
      <BaseItem
        title={title}
        prefix={element}
        style={{
          title: { width: "100%", ...style?.item },
          itemWrapper: { ...style?.itemWrapper },
        }}
      />
      {postCount && (
        <TransText
          {...POST_INFO.topic_post_count(summarizeNum(postCount))}
          sx={{ ...theme.typography.text5, fontWeight: 500 }}
        />
      )}
    </>
  );
};
