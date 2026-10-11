"use client";

import React, { useRef, useState } from "react";
import { Box } from "@mui/material";
import { BaseStyleObj, IMedia } from "@repo/core";
import { Play } from "lucide-react";

interface VideoProps extends IMedia {
  style?: BaseStyleObj;
  setIsLoaded?: (loaded: boolean) => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  posterUrl?: string;
  preload?: "none" | "metadata" | "auto";
}

/**
 * Renders an optimized video player with responsive controls and fallback posters.
 */
export const VideoMedia = ({
  url,
  setIsLoaded,
  style,
  viewMode = "LIST",
  ownerId,
  posterUrl,
  preload = "metadata",
  autoPlay = false,
  ...props
}: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  /**
   * Handles user play and pause toggle logic.
   */
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Box
      onClick={handlePlay}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* 1. The Video Element */}
      <Box
        component="video"
        ref={videoRef}
        src={url}
        poster={posterUrl}
        preload={preload}
        muted
        playsInline
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setIsLoaded && setIsLoaded(true)}
        {...props}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...style,
        }}
      />

      {/* 2. The Play Icon Overlay */}
      {(!isPlaying || viewMode === "LIST") && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "50%",
            width: 44,
            height: 44,
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            pointerEvents: "none",
          }}
        >
          <Play
            size={24}
            style={{ stroke: "white", fill: "white", marginLeft: 4 }}
          />
        </Box>
      )}
    </Box>
  );
};
