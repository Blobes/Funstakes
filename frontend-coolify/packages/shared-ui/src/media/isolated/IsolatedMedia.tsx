"use client";

import React from "react";
import { Box, Stack, Fade } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  COMMON_MEDIA,
  BaseStyleObj,
  IMedia,
  MediaSourceType,
} from "@repo/core";
import { MediaRenderer } from "../view/MediaRenderer";
import { ElementTap } from "../../ElementTap";
import { IsolatedHeader } from "./Header";
import { IsolatedFooter } from "./Footer";
import { LinearCarousel } from "../../carousel/Linear";
import { TransText } from "../../Text";
import { useIsolatedMedia } from "@repo/shared-hooks";

export interface IsolatedProps {
  mediaList?: IMedia[];
  postEngagment?: React.ReactNode;
  postHeader?: React.ReactNode;
  postCaption?: React.ReactNode;
  sourceType?: MediaSourceType;
  isDesktop?: boolean;
  onDoubleTap?: () => void;
  onBackClick?: () => void;
  style?: BaseStyleObj;
  hideInfo?: boolean;
  initialIndex?: number;
}

/**
 * Orchestrator matching media rendering surfaces with floating header actions and information panels.
 */
export const IsolatedMedia = ({
  mediaList = [],
  postEngagment,
  postHeader,
  postCaption,
  sourceType = "GIST",
  isDesktop,
  onDoubleTap,
  onBackClick,
  style,
  initialIndex,
}: IsolatedProps) => {
  const theme = useTheme();

  const {
    activeIndex,
    hideInfo,
    handleSingleTap,
    handleDoubleTap,
    handleSetCurrentIndex,
    handleBackClick,
    handleMoreClick,
  } = useIsolatedMedia({ mediaList, onDoubleTap, initialIndex, onBackClick });

  const carouselItems = mediaList.map((media) => (
    <MediaRenderer
      key={media._id}
      media={media}
      style={{ targetContent: { maxHeight: isDesktop ? "80svh" : "60svh" } }}
    />
  ));

  const MediaContent = () => {
    if (!mediaList || mediaList.length === 0) return null;
    if (mediaList.length === 1) return <MediaRenderer media={mediaList[0]} />;
    return (
      <LinearCarousel
        items={carouselItems}
        initialIndex={initialIndex}
        setCurrentIndex={handleSetCurrentIndex}
        isMultiView={false}
        showArrows={false}
      />
    );
  };

  return (
    <Stack
      direction={isDesktop ? "row" : "column"}
      sx={{
        width: isDesktop ? "60%" : "100%",
        height: "auto",
        mx: "auto",
        position: "relative",
        ...style,
      }}
    >
      <Stack sx={{ flex: 1, width: "100%", position: "relative" }}>
        {/* Immersive Counter Overlay */}
        {mediaList.length > 1 && !hideInfo && (
          <Box
            sx={{
              position: "absolute",
              top: isDesktop ? 80 : 70, // Adjust based on Header height
              right: 20,
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: theme.palette.gray[0],
              px: 1.5,
              py: 0.5,
              borderRadius: 10,
            }}
          >
            <TransText
              {...COMMON_MEDIA.gallery_counter(
                activeIndex + 1,
                mediaList.length,
              )}
              sx={{ ...theme.typography.text5, fontWeight: 600 }}
            />
          </Box>
        )}

        {/* Header */}
        <IsolatedHeader
          sourceType={sourceType}
          onBackClick={handleBackClick}
          onMoreClick={handleMoreClick}
          hide={hideInfo}
        />

        {/* Media Area */}
        <ElementTap onSingleTap={handleSingleTap} onDoubleTap={handleDoubleTap}>
          {MediaContent()}
        </ElementTap>

        {/* Footer */}
        <IsolatedFooter
          isDesktop={isDesktop}
          postEngagment={postEngagment}
          postHeader={postHeader}
          postCaption={postCaption}
          hideInfo={hideInfo}
        />
      </Stack>

      {/* Desktop Engagement Sidebar */}
      {isDesktop && postEngagment && !hideInfo && (
        <Fade in={!hideInfo}>
          <Box> {postEngagment} </Box>
        </Fade>
      )}
    </Stack>
  );
};
