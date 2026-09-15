"use client";

import React, { Fragment } from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  GenericStyle,
  IMenuItem,
  IPage,
  ITopic,
  ListType,
  POST_INFO,
} from "@repo/core";
import { matchPaths, summarizeNum } from "@repo/helpers";
import { usePathname } from "next/navigation";
import { AnchorLink } from "./Buttons";
import { TransText } from "./Text";
import { usePage } from "@repo/shared-hooks";

/**
 * Props for the reusable nav renderer
 */
export interface RenderListProps<T extends IMenuItem> {
  list: T[];
  listType?: ListType;
  onItemClick?: (item?: IMenuItem & T) => void;
  style?: GenericStyle;
  activeItems?: (string | number)[];
  displayActiveState?: boolean;
}

export const RenderItemList = <T extends IMenuItem>({
  list,
  listType = ListType.DEFAULT,
  onItemClick,
  style = {},
  activeItems = [],
  displayActiveState = true,
}: RenderListProps<T>) => {
  const theme = useTheme();
  const pathname = usePathname();
  const { navigateTo } = usePage();

  const { fontSize, fontWeight, color, ...restStyle } = style;

  const itemStyle: GenericStyle = {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    cursor: "pointer",
    gap: theme.gap(3),
    padding: theme.boxSpacing(2, 6),
    borderRadius: theme.radius.full,
    transition: "all 0.2s ease",
    textDecoration: "none",
    "&:hover": {
      backgroundColor: theme.palette.gray.trans[1],
      outline: "none",
    },
    title: {
      ...theme.typography.text3,
      fontSize: (fontSize ?? theme.typography.text3.fontSize) + "!important",
      fontWeight: (fontWeight ?? "600") + "!important",
      color: (color ?? theme.palette.gray[300]) + "!important",
      "&:hover": { textDecoration: "none", ...restStyle["&:hover"] },
    },
    ...restStyle,
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
            element={item.element}
            style={itemStyle.title}
          />
        );
      default:
        return (
          <DefaultItem
            title={item.title}
            element={item.element}
            endElement={(item as any).endElement}
            style={itemStyle.title}
          />
        );
    }
  };

  return (
    <>
      {list.map((item, index) => {
        const isLink = item.type === "LINK" || (!item.type && item.url);
        const isActive = isLink
          ? matchPaths(pathname, item.url ?? "")
          : checkIsActive(item);

        const handleClick = () => {
          if (isLink) {
            navigateTo({
              title: item.title ?? "",
              path: item.url ?? "",
            } as IPage);
          }
          if (item.action) item.action();
          if (onItemClick) (onItemClick as (item: IMenuItem) => void)(item);
        };

        if (item.type === "COMPONENT")
          return <Fragment key={index}>{item.element}</Fragment>;

        const Wrapper = (isLink ? AnchorLink : Stack) as React.ElementType;

        return (
          <Wrapper
            key={index}
            {...(isLink ? { url: item.url ?? "" } : {})}
            onClick={handleClick}
            sx={{
              backgroundColor:
                displayActiveState && isActive
                  ? theme.palette.gray.trans[1]
                  : "transparent",
              ...itemStyle,
            }}
          >
            {renderItem(item)}
          </Wrapper>
        );
      })}
    </>
  );
};

interface Default extends IMenuItem {
  style?: GenericStyle;
  endElement?: React.ReactNode;
}

const DefaultItem = ({ title, element, endElement, style }: Default) => {
  return (
    <Stack
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: 1.5,
      }}
    >
      <Stack
        sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, flex: 1 }}
      >
        {element && element}
        {title && <TransText sx={{ ...style }}>{title}</TransText>}
      </Stack>
      {endElement && endElement}
    </Stack>
  );
};

const TopicItem = ({ title, element, style, postCount }: Default & ITopic) => {
  const theme = useTheme();
  return (
    <>
      <DefaultItem
        title={title}
        element={element}
        style={{ width: "100%", ...style }}
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
