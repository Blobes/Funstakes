"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Box, IconButton, Stack } from "@mui/material";
import { X } from "lucide-react";
import { ColorType, FontType, TextOnMedia } from "@repo/core";
import { FONT_TYPES, useTextMode } from "@repo/shared-hooks";
import { COLOR_CONFIGS } from "@repo/shared-hooks";
import { AppButton } from "../../Buttons";
import { DynamicInput } from "../../inputs/Dynamic";

export interface TextModeProps {
  texts: TextOnMedia[];
  focusedTextId: string | null;
  onTextsChange: (texts: TextOnMedia[]) => void;
  onFocusText: (id: string | null) => void;
  onSwitchToStickerMode?: (stickerId: string) => void;
}

const CanvasOverlay = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 5,
  overflow: "hidden",
});

const FontRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.gap(3),
  overflowX: "auto",
  padding: theme.boxSpacing(8),
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 8,
  // maxWidth: "90%",
  backgroundColor: theme.fixedColors?.grayTrans(0.2, "dark"),
  // borderRadius: theme.radius.full,
  backdropFilter: "blur(10px)",
}));

/**
 * Renders editable text overlays over media canvas with font selection and drag positioning.
 */
export const TextMode = ({
  texts,
  focusedTextId,
  onTextsChange,
  onFocusText,
}: TextModeProps) => {
  const theme = useTheme();

  const {
    activeFont,
    containerRef,
    handleSelectFont,
    handleBlurAll,
    handleContentChange,
    handleDragStart,
    handleRemoveText,
  } = useTextMode({
    texts,
    onTextsChange,
    onFocusText,
  });

  return (
    <CanvasOverlay ref={containerRef} onClick={handleBlurAll}>
      {texts.map((item) => {
        const isFocused = item.id === focusedTextId;
        const activeColorType: ColorType = item.colorType;
        const activeFontType: FontType = item.fontType;
        const colorCfg =
          COLOR_CONFIGS[activeColorType] || COLOR_CONFIGS.SOLID_LIGHT;

        return (
          <Box
            key={item.id}
            onMouseDown={(e) => handleDragStart(e, item.id)}
            sx={{
              position: "absolute",
              left: `${item.position.x}%`,
              top: `${item.position.y}%`,
              cursor: "move",
              border: isFocused
                ? `1.5px dashed ${theme.palette.primary.main}`
                : "1.5px solid transparent",
              borderRadius: theme.radius.base,
              padding: theme.boxSpacing(1, 3),
              backgroundColor: colorCfg.backgroundColor,
              transition: "border 0.2s ease, background-color 0.2s ease",
            }}
          >
            {isFocused && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveText(item.id);
                }}
                sx={{
                  position: "absolute",
                  top: -10,
                  right: -10,
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.common.white,
                  padding: "2px",
                  "&:hover": { backgroundColor: theme.palette.error.dark },
                }}
              >
                <X size={12} />
              </IconButton>
            )}

            <DynamicInput
              value={item.content}
              placeholder="Type here..."
              needsValidation={false}
              onChange={(e) => handleContentChange(item.id, e.target.value)}
              style={{
                height: "fit-content",
                width: "fit-content",
                maxWidth: 300,
                background: "transparent",
                // border: "none",
                // outline: "none",
                color: colorCfg.color,
                fontFamily: activeFontType,
                fontSize: `${item.size}px`,
                textAlign: item.textAlign || "center",
              }}
            />
          </Box>
        );
      })}

      <FontRow onClick={(e) => e.stopPropagation()}>
        {FONT_TYPES.map((font: FontType) => {
          const isSelected = font === activeFont;
          return (
            <AppButton
              key={font}
              size="small"
              onClick={() => handleSelectFont(font)}
              style={{
                // minWidth: 40,
                // height: 40,
                borderRadius: theme.radius.full,
                fontFamily: font,
                color: isSelected
                  ? theme.palette.gray[300]
                  : theme.palette.gray[0],
                backgroundColor: isSelected
                  ? theme.palette.gray[0]
                  : theme.fixedColors.grayTrans(0.5, "dark"),
              }}
            >
              Aa
            </AppButton>
          );
        })}
      </FontRow>
    </CanvasOverlay>
  );
};
