"use client";

import React, { useMemo, useState } from "react";
import { useTheme, styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { Blurhash } from "react-blurhash";
import {
  AnalyzedImage,
  IMedia,
  ColorType,
  FontType,
  BaseStyleObj,
  BaseStyleProps,
} from "@repo/core";
import { analyzeImage } from "@repo/helpers";
import { COLOR_CONFIGS, useMisc } from "@repo/shared-hooks";
import { VideoMedia } from "./VideoMedia";
import { AppImage } from "../../Image";

export interface RendererProps {
  media: IMedia;
  excludeBlurHash?: boolean;
  width?: number;
  height?: number;
  style?: BaseStyleProps;
}

export const MediaRenderer = ({
  media,
  excludeBlurHash = false,
  width,
  height,
  style,
}: RendererProps) => {
  const { isDesktop } = useMisc();
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [analyzedImg, setAnalyzedImg] = useState<AnalyzedImage>();

  const { _id, url, type, alt, dimensions, blurHash, thumbnailUrl } = media;
  const mediaType = type ?? "IMAGE";
  const {
    width: mediaWidth,
    height: mediaHeight,
    aspectRatio,
  } = dimensions || {};

  const isPortrait = useMemo(() => {
    if (aspectRatio !== undefined) return aspectRatio < 1;
    if (mediaHeight && mediaWidth) return mediaHeight > mediaWidth;
    return analyzedImg?.isPortrait;
  }, [aspectRatio, mediaHeight, mediaWidth]);

  // Handles the image load event to check dimensions only if metadata was insufficient.
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    if (aspectRatio !== undefined || (mediaHeight && mediaWidth)) return;
    const img = e.currentTarget;
    const analyzed = analyzeImage(img);
    if (analyzed && analyzed !== analyzedImg) {
      setAnalyzedImg(analyzed);
    }
  };

  // Your existing dynamic style logic
  const contentStyle: BaseStyleObj = {
    height: isPortrait ? (style?.itemWrapper?.height ?? "80svh") : "auto",
    width: isPortrait ? "auto" : "100%",
    maxHeight: style?.itemWrapper?.maxHeight ?? "80svh",
    maxWidth: "100%",
    objectFit: "contain",
    zIndex: 4,
    position: "relative",
    transition: "opacity 0.4s ease-in-out",
    opacity: isLoaded ? 1 : 0,
    // Responsive Breakpoints
    ...(!isDesktop && {
      width: "100%",
      height: isPortrait ? (style?.itemWrapper?.height ?? "auto") : "unset",
      maxHeight: isPortrait
        ? (style?.itemWrapper?.maxHeight ?? "none")
        : "60svh",
    }),
    ...style?.itemWrapper,
  };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: theme.palette.gray?.trans?.[1] || "grey.200",
        cursor: "pointer",
        // Maintain aspect ratio container if dimensions exist to prevent CLS
        aspectRatio: dimensions?.aspectRatio
          ? `${dimensions.aspectRatio}`
          : "auto",
        ...style?.itemWrapper?.base,
        [theme.breakpoints.down("md")]: {
          ...style?.itemWrapper?.smScreen,
        },
      }}
    >
      {/* 1. Optimized Blurred Background */}
      {!excludeBlurHash &&
        (blurHash ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              filter: "blur(48px)",
              transform: "scale(1.1)", // Prevents white edges
            }}
          >
            <Blurhash
              hash={blurHash}
              width="100%"
              height="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          </Box>
        ) : (
          <AppImage
            src={url}
            alt=""
            fill
            style={{
              itemWrapper: {
                filter: "blur(48px)",
                opacity: 0.6,
              },
            }}
          />
        ))}

      {/* 2. Main Media Content */}
      {mediaType === "IMAGE" ? (
        <AppImage
          src={url}
          alt={alt}
          width={width || mediaWidth || analyzedImg?.width}
          height={height || mediaHeight || analyzedImg?.height}
          onLoad={handleImageLoad}
          style={{ itemWrapper: contentStyle }}
        />
      ) : (
        <VideoMedia
          _id={_id}
          url={url}
          posterUrl={thumbnailUrl}
          autoPlay
          loop
          muted
          playsInline
          controls
          setIsLoaded={setIsLoaded}
          style={contentStyle}
        />
      )}
    </Box>
  );
};

const CanvasContainer = styled(Box)({
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
});

const LayerOverlay = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 5,
  pointerEvents: "none",
  overflow: "hidden",
});

/**
 * Displays customized media with static text, sticker, and filter overlays applied.
 */
export const CustomizedMediaRenderer = ({ media }: RendererProps) => {
  const theme = useTheme();
  const customizations = media.customizations;

  const filter = customizations?.filter || "ORIGINAL";
  const texts = customizations?.textsOnMedia || [];
  const stickers = customizations?.stickersOnMedia || [];

  const activeFilterStyle =
    filter !== "ORIGINAL" ? filter.toLowerCase() : "none";

  return (
    <CanvasContainer>
      <MediaRenderer
        media={media}
        style={{
          itemWrapper: { filter: activeFilterStyle },
        }}
      />

      {/* Render Text Overlays */}
      {texts.length > 0 && (
        <LayerOverlay>
          {texts.map((item) => {
            const activeColorType: ColorType = item.colorType;
            const activeFontType: FontType = item.fontType;
            const colorCfg =
              COLOR_CONFIGS[activeColorType] || COLOR_CONFIGS.SOLID_LIGHT;

            return (
              <Box
                key={item.id}
                sx={{
                  position: "absolute",
                  left: `${item.position.x}%`,
                  top: `${item.position.y}%`,
                  borderRadius: theme.radius[8],
                  padding: theme.boxSpacing(1, 3),
                  backgroundColor: colorCfg.backgroundColor,

                  display: "block",
                  color: colorCfg.color,
                  fontFamily: activeFontType,
                  fontSize: `${item.size}px`,
                  textAlign: item.textAlign || "center",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.content}
              </Box>
            );
          })}
        </LayerOverlay>
      )}

      {/* Render Sticker Overlays */}
      {stickers.length > 0 && (
        <LayerOverlay>
          {stickers.map((item) => (
            <Box
              key={item.id}
              sx={{
                position: "absolute",
                left: `${item.position.x}%`,
                top: `${item.position.y}%`,

                fontSize: `${item.size}px`,
                userSelect: "none",
              }}
            >
              {item.content}
            </Box>
          ))}
        </LayerOverlay>
      )}
    </CanvasContainer>
  );
};
