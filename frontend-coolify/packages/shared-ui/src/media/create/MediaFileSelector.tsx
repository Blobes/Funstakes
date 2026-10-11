"use client";

import React from "react";
import { Box, IconButton, MenuItem, Grid, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Camera,
  Image as GalleryIcon,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  FolderLock,
} from "lucide-react";
import { motion, MotionStyle } from "framer-motion";
import { MenuPopup, AppButton, TransText, AppImage } from "@repo/shared-ui";
import {
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  COMMON_INPUT,
} from "@repo/core";
import { MockMediaFile, useMediaFileSelector } from "@repo/shared-hooks";

interface MediaFileSelectorProps {
  initialMaximized?: boolean;
  isOverlay?: boolean;
  allowDrag?: boolean;
  showToggleBtn?: boolean;
  onCameraClick?: () => void;
  onFilesSelected?: (files: MockMediaFile[]) => void;
}

/**
 * Renders an adaptable multi-tier asset selection manager supporting dragging animations and folder traversal modes.
 */
export const MediaFileSelector: React.FC<MediaFileSelectorProps> = ({
  initialMaximized = false,
  isOverlay = false,
  allowDrag = true,
  showToggleBtn = true,
  onCameraClick,
  onFilesSelected,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const defaultMaximizedState = isMobile ? initialMaximized : true;

  const {
    folders,
    isMaximized,
    setIsMaximized,
    currentFolder,
    minimizedMediaList,
    selectedFiles,
    isMenuOpen,
    menuRef,
    dragConstraintsRef,
    permissionStatus,
    handleOpenFolderMenu,
    handleSelectFolder,
    handleToggleSelectFile,
    handleConfirmSelection,
    handleTriggerNativeBrowse,
    handleRequestPermission,
    handleDragEnd,
  } = useMediaFileSelector({
    initialMaximized: defaultMaximizedState,
    allowDrag,
    onFilesSelected,
  });

  const containerStyles: MotionStyle = {
    position: isOverlay ? "fixed" : "relative",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: isOverlay ? 1300 : "auto",
    width: "100%",
    backgroundColor: theme.palette.gray[0],
    borderTopLeftRadius: theme.radius[16],
    borderTopRightRadius: theme.radius[16],
    boxShadow: "0px -4px 20px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  };

  return (
    <Box
      ref={dragConstraintsRef}
      sx={{
        width: "100%",
        height: isMaximized && isOverlay ? "100vh" : "auto",
      }}
    >
      {!isMaximized ? (
        <motion.div
          drag={allowDrag ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.2, bottom: 0 }}
          onDragEnd={handleDragEnd}
          style={containerStyles}
        >
          {allowDrag && (
            <Box
              sx={{
                width: "36px",
                height: "4px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 1,
                cursor: "grab",
                borderRadius: theme.radius[8],
                backgroundColor: theme.palette.gray[100],
              }}
            />
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              px: 2,
              pb: 2,
              pt: allowDrag ? 0 : 2,
              overflowX: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Box
              onClick={onCameraClick}
              sx={{
                flexShrink: 0,
                width: "72px",
                height: "72px",
                borderRadius: theme.radius[8],
                backgroundColor: theme.palette.gray[50],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": { backgroundColor: theme.palette.gray[100] },
              }}
            >
              <Camera size={24} color={theme.palette.gray[200]} />
            </Box>

            {permissionStatus !== "granted" && (
              <Box
                onClick={handleRequestPermission}
                sx={{
                  flexShrink: 0,
                  width: "72px",
                  height: "72px",
                  borderRadius: theme.radius[8],
                  backgroundColor: theme.palette.gray.trans[1],
                  border: `1px dashed ${theme.palette.gray[100]}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  gap: "4px",
                  "&:hover": { backgroundColor: theme.palette.gray.trans[2] },
                }}
              >
                <FolderLock size={20} color={theme.palette.primary.main} />
                <TransText
                  {...COMMON_BUTTON_LABELS.request_access}
                  noComponent
                  sx={{
                    ...theme.typography.text5,
                    color: theme.palette.gray[200],
                  }}
                />
              </Box>
            )}

            {permissionStatus === "granted" &&
              minimizedMediaList.map((file) => {
                const isSelected = selectedFiles.some(
                  (item) => item.id === file.id,
                );
                return (
                  <Box
                    key={file.id}
                    onClick={() => handleToggleSelectFile(file)}
                    sx={{
                      position: "relative",
                      flexShrink: 0,
                      width: "72px",
                      height: "72px",
                      borderRadius: theme.radius[8],
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <AppImage src={file.url} alt={file.name} fill />
                    {isSelected && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor:
                            theme.palette.gray.trans.overlay(0.4),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle2
                          size={20}
                          color={theme.palette.primary.main}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}

            {showToggleBtn && (
              <Box
                onClick={() => setIsMaximized(true)}
                sx={{
                  flexShrink: 0,
                  width: "72px",
                  height: "72px",
                  borderRadius: theme.radius[8],
                  backgroundColor: theme.palette.gray[50],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: theme.palette.gray[100] },
                }}
              >
                <GalleryIcon size={24} color={theme.palette.gray[200]} />
              </Box>
            )}
          </Box>
        </motion.div>
      ) : (
        <Box
          sx={{
            ...(isOverlay
              ? {
                  position: "fixed",
                  inset: 0,
                  zIndex: 1300,
                }
              : {
                  position: "relative",
                  width: "100%",
                }),
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.palette.gray[0],
            height: isOverlay ? "100vh" : "600px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.gray[50]}`,
            }}
          >
            {showToggleBtn && (
              <IconButton
                onClick={() => setIsMaximized(false)}
                sx={{ width: "48px" }}
              >
                <ArrowLeft size={22} color={theme.palette.gray[300]} />
              </IconButton>
            )}

            <AppButton
              variant="text"
              size="small"
              onClick={handleOpenFolderMenu}
              options={{
                "aria-expanded": isMenuOpen,
                "aria-haspopup": "menu",
                endIcon: <ChevronDown size={16} />,
              }}
              style={{
                color: theme.palette.gray[300],
                textTransform: "none",
              }}
            >
              {currentFolder?.id === "gallery" ? (
                <TransText
                  {...COMMON_BUTTON_LABELS.gallery_folder_fallback}
                  noComponent
                />
              ) : (
                currentFolder?.name
              )}
            </AppButton>

            <MenuPopup ref={menuRef}>
              {folders.map((folder) => (
                <MenuItem
                  key={folder.id}
                  onClick={() => handleSelectFolder(folder.id)}
                  selected={folder.id === currentFolder?.id}
                  sx={{ borderRadius: 1, my: 0.5 }}
                >
                  {folder.id === "gallery" ? (
                    <TransText
                      {...COMMON_BUTTON_LABELS.gallery_folder_fallback}
                      noComponent
                    />
                  ) : (
                    folder.name
                  )}
                </MenuItem>
              ))}
              <MenuItem
                onClick={handleTriggerNativeBrowse}
                sx={{
                  borderTop: `1px dashed ${theme.palette.divider}`,
                  color: theme.palette.primary.main,
                  borderRadius: 1,
                  my: 0.5,
                }}
              >
                <TransText {...COMMON_BUTTON_LABELS.browse_files} noComponent />
              </MenuItem>
            </MenuPopup>

            <AppButton
              variant="contained"
              onClick={handleConfirmSelection}
              options={{
                disabled: selectedFiles.length === 0,
              }}
            >
              <TransText
                {...COMMON_BUTTON_LABELS.add_selected_media}
                noComponent
              />
              {selectedFiles.length > 0 ? ` ${selectedFiles.length}` : ""}
            </AppButton>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
            {permissionStatus !== "granted" ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "80%",
                  gap: theme.gap(4),
                  textAlign: "center",
                  px: 4,
                }}
              >
                <FolderLock size={48} color={theme.palette.gray[100]} />
                <TransText
                  {...COMMON_FEEDBACK.file_permission_tagline}
                  sx={{
                    ...theme.typography.text5,
                    color: theme.palette.gray[200],
                  }}
                />
                <AppButton
                  variant="contained"
                  onClick={handleRequestPermission}
                >
                  <TransText
                    {...COMMON_BUTTON_LABELS.grant_permission}
                    noComponent
                  />
                </AppButton>
              </Box>
            ) : (
              <Grid container spacing={0.5}>
                {currentFolder?.files.map((file) => {
                  const isSelected = selectedFiles.some(
                    (item) => item.id === file.id,
                  );
                  return (
                    <Grid key={file.id} size={{ xs: 4, sm: 3, md: 2 }}>
                      <Box
                        onClick={() => handleToggleSelectFile(file)}
                        sx={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "100%",
                          backgroundColor: theme.palette.gray[50],
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <AppImage
                          src={file.url}
                          alt={file.name}
                          fill
                          style={{
                            targetContent: {
                              transition: "transform 0.2s ease-in-out",
                              "&:hover": { transform: "scale(1.02)" },
                            },
                          }}
                        />
                        {isSelected && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor:
                                theme.palette.gray.trans.overlay(0.3),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircle2
                              size={24}
                              color={theme.palette.primary.main}
                            />
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
