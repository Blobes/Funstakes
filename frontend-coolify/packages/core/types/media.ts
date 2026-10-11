"use client";

import { Dimensions, IMediaPayload, StorageProvider } from "./payloads/media";
import { BaseStyleProps, ElementPosition, BaseStyleObj } from "./ui-props";

export type CustomizerMode = "TEXT" | "STICKER" | "FILTER";
export type MediaType = "IMAGE" | "VIDEO" | "GIF";

export type FontType =
  | "sans-serif"
  | "serif"
  | "monospace"
  | "cursive"
  | "fantasy"
  | "system-ui"
  | "cursive-bold";

export type ColorType =
  | "CLEAR_LIGHT"
  | "TRANSLUCENT_LIGHT"
  | "TRANSLUCENT_DARK"
  | "SOLID_LIGHT"
  | "SOLID_DARK"
  | "BRIGHT_RED"
  | "BRIGHT_BLUE"
  | "BRIGHT_YELLOW"
  | "BRIGHT_GREEN"
  | "BRIGHT_PINK"
  | "BRIGHT_ORANGE"
  | "BRIGHT_PURPLE";

export type ImageFilterType =
  | "ORIGINAL"
  | "CLARENDON"
  | "GINGHAM"
  | "MOON"
  | "LARK"
  | "REYES"
  | "JUNO"
  | "SLUMBER";

export type TextAlignment = "left" | "center" | "right";

export interface StickerItem {
  id: string;
  content: string;
  category?: "STICKER" | "EMOJI";
}

export interface TextOnMedia {
  id: string;
  content: string;
  position: ElementPosition;
  fontType: FontType;
  colorType: ColorType;
  size: number;
  textAlign?: TextAlignment;
}

export interface StickerOnMedia extends StickerItem {
  position: ElementPosition;
  size: number;
}

export interface CustomizedMedia {
  textsOnMedia: TextOnMedia[];
  filter: ImageFilterType;
  stickersOnMedia: StickerOnMedia[];
}

export interface IMedia extends IMediaPayload {
  viewMode?: "LIST" | "ISOLATED";
}

export interface MediaProps extends IMedia {
  includeCustomizations?: boolean;
  style?: BaseStyleProps;
  onSingleTap?: (media?: IMedia) => void;
  onDoubleTap?: (media?: IMedia) => void;
}

export interface AnalyzedImage {
  height: number;
  width: number;
  isPortrait: boolean;
}

export interface MediaUploadPayload {
  url: string;
  fileKey: string;
  type: MediaType;
  thumbnailUrl: string | null;
  mimeType: string;
  size: number;
  dimensions: Dimensions;
  blurHash: string;
  storageProvider: StorageProvider;
  customizations?: CustomizedMedia;
}

export type MediaProcessingStatus =
  | "IDLE"
  | "LOADING_ENGINE"
  | "OPTIMIZING"
  | "SUCCESS"
  | "ERROR"
  | "UPLOADING"
  | "FAILED";

export interface MediaProcessingProgress {
  i18nKey?: string;
  fileName?: string;
  status: MediaProcessingStatus;
  progress: number;
  error?: string;
}

export interface ColorConfig {
  name: string;
  backgroundColor: string;
  color: string;
}
