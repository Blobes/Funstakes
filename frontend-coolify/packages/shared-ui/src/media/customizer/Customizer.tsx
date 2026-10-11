"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";
import {
  COMMON_BUTTON_LABELS,
  CustomizedMedia,
  CustomizerMode,
  IMedia,
} from "@repo/core";
import { useMediaCustomizer } from "@repo/shared-hooks";
import { ColorSetter } from "./ColorSetter";
import { TextAlignSetter } from "./TextAlignSetter";
import { FilterMode } from "./FilterMode";
import { TextMode } from "./TextMode";
import { StickerMode } from "./StickerMode";
import { ContentResizer } from "./Resizer";
import { TabUI } from "../../TabUI";
import { AppButton } from "../../Buttons";
import { TransText } from "../../Text";
import { MediaRenderer } from "../view/MediaRenderer";

export interface MediaCustomizerProps {
  media: IMedia;
  onSave?: (customizedMedia: CustomizedMedia) => void;
}

const CustomizerContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "600px",
  backgroundColor: theme.palette.common.black,
  borderRadius: theme.radius[12],
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const HeaderBar = styled(Stack)(({ theme }) => ({
  position: "absolute",
  top: 16,
  left: 16,
  right: 16,
  zIndex: 10,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}));

/**
 * Renders video and image customizer with layered text, sticker overlays, and media-specific filter styling.
 */
export const MediaCustomizer = ({ media, onSave }: MediaCustomizerProps) => {
  const theme = useTheme();
  const {
    activeMode,
    isPreview,
    textsOnMedia,
    filter,
    stickersOnMedia,
    focusedTextId,
    focusedStickerId,
    setTextsOnMedia,
    setFilter,
    setStickersOnMedia,
    setFocusedTextId,
    setFocusedStickerId,
    handleModeChange,
    togglePreview,
    handleSave,
  } = useMediaCustomizer({ media, onSave });

  const currentFocusedText = textsOnMedia.find((t) => t.id === focusedTextId);
  const activeFilterStyle =
    filter !== "ORIGINAL" ? filter.toLowerCase() : "none";

  return (
    <CustomizerContainer>
      <HeaderBar>
        <AppButton variant="contained" onClick={handleSave}>
          <TransText {...COMMON_BUTTON_LABELS.done} noComponent />
        </AppButton>

        {!isPreview && activeMode === "TEXT" && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextAlignSetter
              textAlign={currentFocusedText?.textAlign}
              disabled={!focusedTextId}
              onAlignmentChange={(newAlignment) => {
                if (focusedTextId) {
                  setTextsOnMedia(
                    textsOnMedia.map((t) =>
                      t.id === focusedTextId
                        ? { ...t, textAlign: newAlignment }
                        : t,
                    ),
                  );
                }
              }}
            />

            <ColorSetter
              activeColorType={currentFocusedText?.colorType}
              disabled={!focusedTextId}
              onColorChange={(newColor) => {
                if (focusedTextId) {
                  setTextsOnMedia(
                    textsOnMedia.map((t) =>
                      t.id === focusedTextId
                        ? { ...t, colorType: newColor }
                        : t,
                    ),
                  );
                }
              }}
            />
          </Stack>
        )}

        <AppButton
          variant={isPreview ? "contained" : "outlined"}
          onClick={togglePreview}
          style={{
            ...(isPreview && {
              backgroundColor: theme.palette.gray[0],
            }),
          }}
        >
          <TransText
            {...(isPreview
              ? COMMON_BUTTON_LABELS.edit
              : COMMON_BUTTON_LABELS.preview)}
            noComponent
          />
        </AppButton>
      </HeaderBar>

      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MediaRenderer
          media={media}
          style={{
            targetContent: {
              maxHeight: "100%",
              height: "100%",
              width: "100%",
              objectFit: "contain",
              filter: activeFilterStyle,
            },
            wrapper: {
              base: {
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
              },
            },
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: !isPreview && activeMode !== "TEXT" ? 0.4 : 1,
            pointerEvents:
              activeMode === "TEXT" && !isPreview ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        >
          <TextMode
            texts={textsOnMedia}
            focusedTextId={focusedTextId}
            onTextsChange={setTextsOnMedia}
            onFocusText={setFocusedTextId}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: !isPreview && activeMode !== "STICKER" ? 0.4 : 1,
            pointerEvents:
              activeMode === "STICKER" && !isPreview ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        >
          <StickerMode
            stickers={stickersOnMedia}
            focusedStickerId={focusedStickerId}
            onStickersChange={setStickersOnMedia}
            onFocusSticker={setFocusedStickerId}
          />
        </Box>

        {!isPreview && activeMode === "FILTER" && (
          <FilterMode
            activeFilter={filter}
            mediaUrl={media.url}
            onFilterChange={setFilter}
          />
        )}
      </Box>

      {!isPreview && (
        <>
          {focusedTextId && (
            <ContentResizer
              currentValue={currentFocusedText?.size}
              onResizeChange={(newSize) => {
                setTextsOnMedia(
                  textsOnMedia.map((t) =>
                    t.id === focusedTextId ? { ...t, size: newSize } : t,
                  ),
                );
              }}
            />
          )}

          {focusedStickerId && (
            <ContentResizer
              currentValue={
                stickersOnMedia.find((s) => s.id === focusedStickerId)?.size
              }
              onResizeChange={(newSize) => {
                setStickersOnMedia(
                  stickersOnMedia.map((s) =>
                    s.id === focusedStickerId ? { ...s, size: newSize } : s,
                  ),
                );
              }}
            />
          )}

          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            <TabUI
              options={[
                { id: "TEXT", label: "Text" },
                { id: "STICKER", label: "Sticker" },
                { id: "FILTER" as CustomizerMode, label: "Filter" },
              ]}
              activeTab={activeMode}
              onChange={handleModeChange}
            />
          </Box>
        </>
      )}
    </CustomizerContainer>
  );
};
