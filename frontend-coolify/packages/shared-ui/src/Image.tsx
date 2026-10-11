"use client";

import React, { useState, useCallback } from "react";
import Image, { ImageProps } from "next/image";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { BaseStyleProps } from "@repo/core";
import { BoxSkeleton } from "./Skeletons";
import { FileWarning } from "lucide-react";
import { TransText } from "./Text";

type BaseNextImageProps = Omit<
  ImageProps,
  "src" | "alt" | "width" | "height" | "fill" | "style"
>;

export interface AppImageProps extends BaseNextImageProps {
  src: string;
  alt?: string;
  prioritize?: boolean;
  width?: number;
  height?: number;
  isFullWidth?: boolean;
  fill?: boolean;
  showPlaceholder?: boolean;
  style?: BaseStyleProps;
  onLoad?: ImageProps["onLoad"];
  onError?: ImageProps["onError"];
}

/**
 * Shared Next.js Image with optional fill layout, lazy loading, and skeleton.
 */
export const AppImage = ({
  src,
  alt = "Image",
  width,
  height,
  fill = false,
  loading,
  prioritize = false,
  showPlaceholder = false,
  sizes,
  isFullWidth = false,
  style,
  onLoad,
  onError,
  ...rest
}: AppImageProps) => {
  const theme = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad: NonNullable<ImageProps["onLoad"]> = useCallback(
    (event) => {
      setLoaded(true);
      onLoad?.(event);
    },
    [onLoad],
  );

  const handleError: NonNullable<ImageProps["onError"]> = useCallback(
    (event) => {
      setErrored(true);
      onError?.(event);
    },
    [onError],
  );

  // priority implies eager load; Next warns if both conflict
  const resolvedLoading = prioritize ? "eager" : (loading ?? "lazy");

  if (!src || errored) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
          bgcolor: theme.palette.gray.trans[1],
          borderRadius: theme.radius[12],
          ...style?.wrapper,
        }}
      >
        <FileWarning size={40} />
        <TransText>Failed to load content</TransText>
      </Box>
    );
  }

  const imageNode = (
    <Image
      src={src}
      alt={alt}
      {...(fill
        ? { fill: true }
        : {
            width: width ?? 0,
            height: height ?? 0,
          })}
      sizes={
        sizes ?? (isFullWidth ? "100vw" : "(max-width: 900px) 100vw, 50vw")
      }
      fetchPriority={prioritize ? "high" : "auto"}
      loading={resolvedLoading}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        ...(fill
          ? { objectFit: "cover" }
          : { maxWidth: "100%", height: "auto" }),
      }}
      {...rest}
    />
  );

  return (
    <Box
      sx={{
        position: fill ? "relative" : undefined,
        width: fill ? "100%" : undefined,
        height: fill ? "100%" : undefined,
        overflow: fill ? "hidden" : undefined,
        lineHeight: 0,
        "& img": style?.targetContent,
      }}
    >
      {showPlaceholder && !loaded && (
        <BoxSkeleton
          animation="wave"
          containerStyle={{
            position: fill ? "absolute" : "relative",
            inset: fill ? 0 : undefined,
            width: fill ? "100%" : width,
            height: fill ? "100%" : height || 120,
            zIndex: 0,
          }}
        />
      )}
      {imageNode}
    </Box>
  );
};
