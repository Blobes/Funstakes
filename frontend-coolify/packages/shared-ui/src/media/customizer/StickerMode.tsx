"use client";

import React, { useRef, useEffect } from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Box, Grid, IconButton, Stack, useMediaQuery } from "@mui/material";
import { Check, X, ChevronUp } from "lucide-react";
import {
  StickerOnMedia,
  OverlayRef,
  COMMON_BUTTON_LABELS,
  COMMON_INPUT,
  COMMON_FEEDBACK,
} from "@repo/core";
import {
  useStickerMode,
  useDrag,
  useStaticTranslation,
  StickerTab,
} from "@repo/shared-hooks";
import { AppButton } from "../../Buttons";
import { TabUI } from "../../TabUI";
import { Drawer } from "../../Drawer";
import { SearchBar } from "../../inputs/Search";
import { TransText } from "../../Text";

export interface StickerModeProps {
  stickers: StickerOnMedia[];
  focusedStickerId: string | null;
  onStickersChange: (stickers: StickerOnMedia[]) => void;
  onFocusSticker: (id: string | null) => void;
}

interface StickerLibraryProps {
  drawerRef: React.RefObject<OverlayRef | null>;
  activeTab: StickerTab;
  setActiveTab: (tab: StickerTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLibraryIds: string[];
  filteredLibrary: Array<{ id: string; content: React.ReactNode }>;
  onClose: () => void;
  onBatchAddSelected: () => void;
  onUnselectAll: () => void;
  onToggleLibrarySelect: (id: string) => void;
}

const MinimizedTray = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.gap(3),
  overflowX: "auto",
  padding: theme.boxSpacing(2, 4),
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 8,
  maxWidth: "90%",
  backgroundColor: theme.palette.gray[300],
  borderRadius: theme.radius.full,
  backdropFilter: "blur(10px)",
  touchAction: "pan-x",
}));

/**
 * Renders the drawer view for browsing, searching, and selecting stickers and emojis.
 */
const StickerLibraryDrawer = ({
  drawerRef,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  selectedLibraryIds,
  filteredLibrary,
  onClose,
  onBatchAddSelected,
  onUnselectAll,
  onToggleLibrarySelect,
}: StickerLibraryProps) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  return (
    <Drawer
      ref={drawerRef}
      transDirection={{ base: "up", mobile: "up" }}
      clickToClose={true}
      showHeader={false}
      onClose={onClose}
      content={
        <Stack gap={theme.gap(4)}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <IconButton onClick={onClose}>
              <X />
            </IconButton>
            <TabUI
              options={[
                { id: "STICKER", label: "Stickers" },
                { id: "EMOJI", label: "Emojis" },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <AppButton
              variant="contained"
              size="medium"
              onClick={onBatchAddSelected}
              options={{ disabled: selectedLibraryIds.length === 0 }}
            >
              <TransText
                {...COMMON_BUTTON_LABELS.add(selectedLibraryIds.length)}
                noComponent
              />
            </AppButton>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={theme.gap(2)}
          >
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translateTxtString(
                COMMON_INPUT.placeholder.search_library(activeTab),
              )}
            />
            {selectedLibraryIds.length > 0 && (
              <TransText
                {...COMMON_BUTTON_LABELS.unselect_all}
                onClick={onUnselectAll}
                sx={{
                  ...theme.typography.text4,
                  cursor: "pointer",
                  color: theme.palette.primary.main,
                  whiteSpace: "nowrap",
                }}
              />
            )}
          </Stack>

          <Box sx={{ overflowY: "auto", flex: 1, maxHeight: 300 }}>
            {filteredLibrary.length === 0 ? (
              <TransText
                {...COMMON_FEEDBACK.no_sticker_or_emoji_found(activeTab)}
                onClick={onUnselectAll}
                sx={{
                  ...theme.typography.text4,
                  textAlign: "center",
                  color: theme.palette.text.secondary,
                  padding: theme.boxSpacing(6),
                }}
              />
            ) : (
              <Grid container spacing={2}>
                {filteredLibrary.map((item) => {
                  const isSelected = selectedLibraryIds.includes(item.id);
                  return (
                    <Grid
                      size={{ xs: 3 }}
                      key={item.id}
                      onClick={() => onToggleLibrarySelect(item.id)}
                      sx={{
                        fontSize: "32px",
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        padding: theme.boxSpacing(2),
                        borderRadius: theme.radius.base,
                        backgroundColor: isSelected
                          ? theme.palette.gray.trans[1]
                          : "transparent",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {item.content}
                      {isSelected && (
                        <Check
                          size={16}
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            color: theme.palette.primary.main,
                          }}
                        />
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Stack>
      }
    />
  );
};

/**
 * Handles overlay rendering, positioning, and selection workflows for media stickers and emojis.
 */
export const StickerMode = ({
  stickers,
  focusedStickerId,
  onStickersChange,
  onFocusSticker,
}: StickerModeProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<OverlayRef | null>(null);

  const {
    isMaximized,
    setIsMaximized,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedLibraryIds,
    filteredLibrary,
    handleAddSingleSticker,
    handleToggleLibrarySelect,
    handleUnselectAll,
    handleBatchAddSelected,
    handleFocus,
    handleRemoveSticker,
    handlePositionChange,
  } = useStickerMode({
    stickers,
    onStickersChange,
    onFocusSticker,
  });

  const { handlers: stickerDragHandlers } = useDrag({
    containerRef,
    onPositionChange: (position) => {
      if (focusedStickerId) {
        handlePositionChange(focusedStickerId, position);
      }
    },
  });

  const {
    dragOffset,
    resolveDragConfig,
    handlers: trayDragHandlers,
  } = useDrag();
  const trayDragInfo = resolveDragConfig("up");

  /**
   * Syncs imperative drawer control state with sticker mode view model.
   */
  useEffect(() => {
    if (isMaximized) {
      drawerRef.current?.openOverlay();
    } else {
      drawerRef.current?.closeOverlay();
    }
  }, [isMaximized]);

  return (
    <Box
      ref={containerRef}
      sx={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}
    >
      {stickers.map((item) => {
        const isFocused = item.id === focusedStickerId;
        return (
          <Box
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleFocus(item.id);
            }}
            onMouseDown={(e) =>
              stickerDragHandlers.onElementDragStart(e, item.id, handleFocus)
            }
            sx={{
              position: "absolute",
              left: `${item.position.x}%`,
              top: `${item.position.y}%`,
              fontSize: `${item.size}px`,
              cursor: "move",
              pointerEvents: "auto",
              userSelect: "none",
            }}
          >
            {isFocused && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSticker(item.id);
                }}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.common.white,
                  padding: "2px",
                }}
              >
                <X size={12} />
              </IconButton>
            )}
            {item.content}
          </Box>
        );
      })}

      <MinimizedTray
        {...(isMobile && {
          onTouchStart: trayDragHandlers.onTouchStart,
          onTouchMove: trayDragHandlers.onTouchMove,
          onTouchEnd: () =>
            trayDragHandlers.onTouchEnd(() => setIsMaximized(true)),
        })}
        sx={{
          pointerEvents: "auto",
          ...(dragOffset > 0 &&
            trayDragInfo.axis === "Y" && {
              transform: `translate(-50%, -${dragOffset}px) !important`,
              transition: "none !important",
            }),
        }}
      >
        <IconButton onClick={() => setIsMaximized(true)}>
          <ChevronUp />
        </IconButton>
        {filteredLibrary.slice(0, 16).map((item) => (
          <Box
            key={item.id}
            onClick={() => handleAddSingleSticker(item)}
            sx={{
              fontSize: "24px",
              cursor: "pointer",
              padding: theme.boxSpacing(1),
            }}
          >
            {item.content}
          </Box>
        ))}
      </MinimizedTray>

      <StickerLibraryDrawer
        drawerRef={drawerRef}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLibraryIds={selectedLibraryIds}
        filteredLibrary={filteredLibrary}
        onClose={() => setIsMaximized(false)}
        onBatchAddSelected={handleBatchAddSelected}
        onUnselectAll={handleUnselectAll}
        onToggleLibrarySelect={handleToggleLibrarySelect}
      />
    </Box>
  );
};
