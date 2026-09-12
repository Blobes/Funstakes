"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Box, Menu } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MenuRef, GenericStyle, IMenuItem, ListType, LISTS } from "@repo/core";
import { RenderItemList, RenderListProps } from "./RenderItems";
import { SearchBar } from "./inputs/Search";
import { scrollBarStyle } from "@repo/helpers";
import { ProgressIcon } from "./LoadingUIs";
import { useStaticTranslation } from "@repo/shared-hooks";
import { TransText } from "./Text";

interface MenuProps {
  children?: ReactNode;
  stickToScreen?: boolean;
  heightThreshold?: number;
  marginThreshold?: number;
  onMenuClose?: () => void;
  style?: GenericStyle;
}

/**
 * Low-level menu popover surface mapping anchor element positioning configurations.
 */
export const MenuPopup = forwardRef<MenuRef, MenuProps>(
  (
    {
      children,
      stickToScreen = true,
      heightThreshold,
      marginThreshold = 16,
      onMenuClose,
      style,
    },
    ref,
  ) => {
    const theme = useTheme();
    const [anchorElNav, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClose = () => {
      if (onMenuClose) onMenuClose();
      setAnchorEl(null);
    };

    useImperativeHandle(ref, () => ({
      openMenu: (anchor: HTMLElement) => {
        setAnchorEl(anchor);
      },
      closeMenu: () => {
        handleClose();
      },
    }));

    // Convert potential Fragments or conditional arrays into clean flat lists for MUI
    const cleanChildren = React.Children.toArray(children).filter(Boolean);

    return (
      <Menu
        anchorEl={anchorElNav}
        open={Boolean(anchorElNav)}
        onClose={handleClose}
        keepMounted
        disableScrollLock
        marginThreshold={stickToScreen ? marginThreshold : null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: theme.radius[2],
              padding: theme.boxSpacing(2),
              border: `1px solid ${theme.palette.gray[50]}`,
              width: "fit-content",
              minWidth: 150,
              maxWidth: 300,
              maxHeight: `calc(100vh - ${heightThreshold ?? 20}%)`,
              marginTop: theme.gap(4),
              ...scrollBarStyle(theme),
              "& ul": {
                display: "flex",
                flexDirection: "column",
                ...style?.ul,
              },
              ...style,
            },
          },
          list: { disablePadding: true },
        }}
        sx={{
          alignItems: "center",
          padding: theme.boxSpacing(2, 0),
        }}
      >
        {cleanChildren}
      </Menu>
    );
  },
);

interface MenuListProps<T extends IMenuItem> extends RenderListProps<T> {
  listName?: ListType;
  menuRef: React.RefObject<MenuRef | null>;
  showSearchBar?: boolean;
  externalSearchQuery?: string;
  onExternalSearchChange?: (val: string) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  infiniteScrollHook?: (args: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage?: () => void;
  }) => { sentinelRef: React.RefObject<any> };
  style?: {
    container?: GenericStyle;
    item?: GenericStyle;
    searchBar?: GenericStyle;
  };
}

/**
 * Handles searchable list container interactions using dropdown menu wrappers.
 */
export const DisplayList = <T extends IMenuItem>({
  list,
  listName = ListType.DEFAULT,
  onItemClick,
  onMenuClose,
  style,
  showActiveItem,
  menuRef,
  activeItem,
  showSearchBar = false,
  externalSearchQuery,
  onExternalSearchChange,
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  infiniteScrollHook,
  stickToScreen,
  heightThreshold,
}: MenuListProps<T> & MenuProps) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const [filteredList, setFilteredList] = useState<T[]>(list);
  const [searchQuery, setSearchQuery] = useState("");

  // Invoke injected dependency hook when supplied by the calling feature context
  const scrollMetrics = infiniteScrollHook?.({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const sentinelRef = scrollMetrics?.sentinelRef;

  // Sync state when props change
  useEffect(() => {
    setFilteredList(list);
  }, [list]);

  /**
   * Tracks filter queries locally or bubbles modifications to the parent component.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const query = e.target.value.toLowerCase();

      if (onExternalSearchChange) {
        onExternalSearchChange(e.target.value);
        return;
      }

      setSearchQuery(query);
      if (!query) {
        setFilteredList(list);
        return;
      }
      const filtered = list.filter((item) =>
        Object.values(item).some(
          (val) => typeof val === "string" && val.toLowerCase().includes(query),
        ),
      );
      setFilteredList(filtered);
    },
    [list, onExternalSearchChange],
  );

  const currentQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;

  // Derived States
  const isSourceEmpty = filteredList.length === 0 && !isLoading;
  const isSearchEmpty =
    currentQuery.length > 0 && filteredList.length === 0 && !isLoading;

  /**
   * Returns localized fallback messaging contextual parameters.
   */
  const feedback = () => {
    if (isSourceEmpty)
      return LISTS(translateTxtString).MESSAGES[listName].empty;
    if (isSearchEmpty)
      return LISTS(translateTxtString).MESSAGES[listName].noMatch;
    if (isLoading) return "Fetching list entries...";
    return null;
  };

  // Default styles for nav menus
  const itemStyle: GenericStyle = {
    padding: theme.boxSpacing(4, 6),
    gap: theme.gap(8),
    textAlign: "left",
    width: "100%",
    "& svg": {
      width: "20px",
      height: "20px",
      flex: "none",
    },
    ...style?.item,
  };

  return (
    <MenuPopup
      ref={menuRef}
      stickToScreen={stickToScreen}
      heightThreshold={heightThreshold}
      onMenuClose={onMenuClose}
      style={{
        [theme.breakpoints.down("sm")]: {
          width: "88%",
          maxWidth: "unset",
        },
        ...(style?.container as any),
      }}
    >
      {showSearchBar && (!isSourceEmpty || currentQuery.length > 0) && (
        <SearchBar
          onChange={handleChange}
          value={currentQuery}
          placeholder="Search"
          style={{
            width: "100%",
            borderRadius: 0,
            height: 46,
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: theme.palette.gray[0],
            padding: theme.boxSpacing(6),
            border: "none",
            borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
            "&:hover": {
              border: "inherit",
              borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
            },
            "& svg": { width: "16px", height: "16px" },
            ...style?.searchBar,
          }}
        />
      )}
      {feedback() ? (
        <Box
          sx={{ width: "100%", p: theme.boxSpacing(4), textAlign: "center" }}
        >
          <TransText
            sx={{ ...theme.typography.text4, color: theme.palette.gray[200] }}
          >
            {feedback()}
            {isSearchEmpty && (
              <b style={{ display: "block" }}>"{currentQuery}"</b>
            )}
          </TransText>
        </Box>
      ) : (
        // Extracted children from fragment layout into transparent inline elements array block
        [
          <RenderItemList
            key="render-item-list"
            list={filteredList}
            listType={listName}
            onItemClick={(item) => {
              menuRef.current?.closeMenu();
              if (onItemClick) onItemClick(item as any);
            }}
            style={itemStyle}
            showActiveItem={showActiveItem}
            activeItem={activeItem}
          />,
          hasNextPage && (
            <Box
              key="infinite-scroll-sentinel"
              ref={sentinelRef}
              sx={{
                padding: theme.gap(4),
                display: "flex",
                justifyContent: "center",
                minHeight: "40px",
              }}
            >
              {isFetchingNextPage && <ProgressIcon options={{ size: 24 }} />}
            </Box>
          ),
        ]
      )}
    </MenuPopup>
  );
};
