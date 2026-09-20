"use client";

import React, { useMemo, useCallback } from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { X, SlidersHorizontal } from "lucide-react";
import { applyBGEffects } from "@repo/helpers";
import { MediaProps, MediaProcessingProgress, COMMON_MEDIA } from "@repo/core";
import { ProgressUI } from "../../LoadingUIs";
import { TransText } from "../../Text";
import { Media } from "../view/Media";
import { MediaGrid, MediaScroll } from "../view/MediaGallery";
import { useMediaFileTransform } from "@repo/shared-hooks";

interface SelectedMediaFilesProps {
  stagedFiles: File[];
  processingStates?: Record<
    string,
    { upload?: MediaProcessingProgress; compression?: MediaProcessingProgress }
  >;
  onRemoveFile: (index: number) => void;
  onPreviewClick?: (objectUrl: string, index: number) => void;
  onCustomizeMedia?: (file: File, index: number) => void;
}

/**
 * Maps raw selected browser files into interactive media preview elements containing overlay metrics and cancellation hooks.
 */
export const SelectedMediaFiles: React.FC<SelectedMediaFilesProps> = ({
  stagedFiles,
  processingStates = {},
  onRemoveFile,
  onPreviewClick,
  onCustomizeMedia,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleSingleTap = useCallback(
    (media: MediaProps, index: number) => {
      if (onPreviewClick) {
        onPreviewClick(media.url, index);
      }
    },
    [onPreviewClick],
  );

  // Consume shared hook for formatting media list
  const formattedMediaList = useMediaFileTransform({
    files: stagedFiles,
    onSingleTap: handleSingleTap,
  });

  const mediaStyle = useMemo(
    () => ({
      container: {
        base: { borderRadius: theme.radius[3] },
        smallScreen: { borderRadius: 0 },
      },
      content: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      },
    }),
    [theme],
  );

  const actionButtonStyle = useMemo(
    () => ({
      position: "absolute",
      top: "8px",
      zIndex: 10,
      backgroundColor: theme.palette.gray.trans.overlay(0.6),
      color: theme.fixedColors.gray50,
      backdropFilter: "blur(4px)",
      padding: "6px",
      "&:hover": {
        backgroundColor: theme.palette.gray.trans.overlay(0.8),
      },
    }),
    [theme],
  );

  /**
   * Evaluates if a file compression loop is active and returns the percentage markup overlay.
   */
  const renderCompressionOverlay = (file: File) => {
    const trackingId = (file as any).trackingId;
    if (!trackingId) return null;

    const compressionState = processingStates[trackingId]?.compression;
    if (!compressionState || compressionState.status === "SUCCESS") return null;

    const isIdle =
      compressionState.status === "IDLE" ||
      compressionState.status === "LOADING_ENGINE";
    const currentProgress = compressionState.progress || 0;

    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: theme.palette.gray.trans.overlay(0.75),
          backdropFilter: "blur(6px)",
          borderRadius: "inherit",
        }}
      >
        <ProgressUI
          value={isIdle ? undefined : currentProgress}
          options={{
            variant: isIdle ? "indeterminate" : "determinate",
            size: 24,
          }}
          style={{ container: { flexShrink: 0 } }}
        />
        <TransText
          {...COMMON_MEDIA.track_upload_progress(currentProgress)}
          sx={{
            ...theme.typography.text4,
            color: theme.fixedColors.gray50,
            fontWeight: 500,
          }}
        />
      </Box>
    );
  };

  /**
   * Helper utility rendering floating customization/delete actions and processing metrics directly above layout slots.
   */
  const renderWithActions = (node: React.ReactNode, index: number) => {
    const file = stagedFiles[index];
    if (!file) return null;

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: theme.radius[3],
          overflow: "hidden",
        }}
      >
        {node}
        {renderCompressionOverlay(file)}

        {/* Customizer Action */}
        {onCustomizeMedia && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onCustomizeMedia(file, index);
            }}
            sx={{
              ...actionButtonStyle,
              left: "8px",
              "&:hover": {
                ...actionButtonStyle["&:hover"],
                color: theme.palette.primary.main,
              },
            }}
          >
            <SlidersHorizontal size={16} />
          </IconButton>
        )}

        {/* Delete action */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFile(index);
          }}
          sx={{
            ...actionButtonStyle,
            right: "8px",
            "&:hover": {
              ...actionButtonStyle["&:hover"],
              color: theme.palette.error.main,
            },
          }}
        >
          <X size={16} />
        </IconButton>
      </Box>
    );
  };

  if (stagedFiles.length === 0) return null;

  if (stagedFiles.length === 1) {
    return renderWithActions(
      <Media
        {...formattedMediaList[0]}
        includeCustomizations
        style={{ container: mediaStyle.container }}
      />,
      0,
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {isSmallScreen ? (
        <MediaScroll
          mediaList={formattedMediaList}
          style={mediaStyle}
          bgEffects={() => ({
            ...applyBGEffects(theme),
            overlay: {
              children: formattedMediaList.map((_, index) =>
                renderWithActions(null, index),
              ),
            },
          })}
        />
      ) : (
        <MediaGrid
          mediaList={formattedMediaList.map((media, index) => ({
            ...media,
            customContainerWrapper: (node: React.ReactNode) =>
              renderWithActions(node, index),
          }))}
          style={mediaStyle}
          bgEffects={() => ({
            ...applyBGEffects(theme),
            zoom: (selector: string) => ({
              ...applyBGEffects(theme).zoom(selector),
              "& .MuiImageListItem-item": {
                position: "relative",
              },
            }),
          })}
        />
      )}
    </Box>
  );
};
