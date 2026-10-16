"use client";

import React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AppButton,
  InlineMsgUI,
  MediaFileSelector,
  SelectedMediaFiles,
  DynamicInput,
  DisplayList as TopicList,
  TransText,
} from "@repo/shared-ui";
import { Content, FilesProps } from "./useGistContent";
import {
  COMMON_MEDIA,
  ITopic,
  ListType,
  POST_BUTTON_LABELS,
  POST_FEEDBACK,
  POST_INPUT,
} from "@repo/core";
import { GistContext } from "./CreateGist";
import { MockMediaFile, useStaticTranslation } from "@repo/shared-hooks";

export interface GistStepProps extends Content {
  gistContext: GistContext;
}

/**
 * Standardized Material UI post layout consumer.
 */
export const GistContentStep: React.FC<GistStepProps & FilesProps> = ({
  caption,
  setCaption,
  stagedFiles,
  topics,
  gistContext,
  setStep,
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();

  const {
    isProcessing,
    inlineErrMsg,
    handleSelectedFiles,
    handleNext,
    topicsMenuRef,
    topicSearchQuery,
    setTopicSearchQuery,
    availableTopicsList,
    isTopicsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    handleTopics,
    handleRemoveTopic,
    handleRemoveFile,
    processingStates,
  } = gistContext;

  /**
   * Adapts modern browser selection outputs back into the contextual raw file handler pipeline.
   */
  const handleMediaSelection = (selectedMockFiles: MockMediaFile[]) => {
    const rawFiles = selectedMockFiles
      .map((mock) => mock.rawFile)
      .filter((file): file is File => !!file);
    if (rawFiles.length > 0) {
      handleSelectedFiles(rawFiles);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(7.5),
      }}
    >
      <Stack sx={{ gap: theme.gap(2) }}>
        <TransText
          {...POST_FEEDBACK.compose_post}
          sx={{ ...theme.typography.text1, color: theme.palette.gray[300] }}
        />
        {!isProcessing && inlineErrMsg && (
          <InlineMsgUI msg={inlineErrMsg} type="ERROR" />
        )}
        <DynamicInput
          variant="outlined"
          label={translateTxtString(POST_INPUT.label.whats_happening)}
          placeholder={translateTxtString(
            POST_INPUT.placeholder.share_your_thought,
          )}
          value={caption}
          disabled={isProcessing}
          onChange={(e) => setCaption(e.target.value)}
        />
      </Stack>

      {stagedFiles.length > 0 && (
        <Stack sx={{ gap: theme.gap(3) }}>
          <SelectedMediaFiles
            stagedFiles={stagedFiles}
            processingStates={processingStates || {}}
            onRemoveFile={handleRemoveFile}
            onPreviewClick={() => setStep?.("MEDIA_PREVIEW")}
          />
          <TransText
            {...COMMON_MEDIA.added_media(stagedFiles.length)}
            sx={{
              ...theme.typography.text4,
              color: theme.palette.gray[200],
              fontWeight: 600,
            }}
          />
        </Stack>
      )}

      <Stack sx={{ gap: theme.gap(2.5) }}>
        <TransText
          {...POST_FEEDBACK.categorization_taxonomy}
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            fontWeight: 600,
          }}
        />
        <AppButton
          variant="outlined"
          size="x-small"
          onClick={(e) =>
            topicsMenuRef.current?.openMenu(e as unknown as HTMLElement)
          }
          options={{ disabled: isProcessing }}
          style={{
            alignSelf: "flex-start",
          }}
        >
          <TransText {...POST_BUTTON_LABELS.post_add_topic} noComponent />
        </AppButton>

        {topics.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: theme.gap(2),
              mt: theme.gap(1),
            }}
          >
            {topics.map((topicTitle) => (
              <Chip
                key={topicTitle}
                label={topicTitle}
                onDelete={() => handleRemoveTopic(topicTitle)}
                disabled={isProcessing}
                sx={{
                  backgroundColor: theme.palette.gray[50],
                  color: theme.palette.gray[300],
                  fontWeight: 500,
                  borderRadius: theme.radius[16],
                  "& .MuiChip-deleteIcon": {
                    color: theme.palette.error.light,
                    "&:hover": { color: theme.palette.error.main },
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Stack>

      <TopicList<ITopic>
        menuRef={topicsMenuRef}
        list={availableTopicsList}
        listName={ListType.TOPICS}
        showSearchBar
        externalSearchQuery={topicSearchQuery}
        onExternalSearchChange={setTopicSearchQuery}
        isLoading={isTopicsLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        stickToScreen={false}
        heightThreshold={65}
        style={{
          item: {
            padding: theme.boxSpacing(4, 8),
            gap: "10px",
            borderRadius: 0,
            "& svg": { width: "16px", height: "16px" },
          },
          itemWrapper: {
            padding: 0,
          },
        }}
        onItemClick={(item) => handleTopics(item)}
      />

      <MediaFileSelector
        initialMaximized={false}
        isOverlay={false}
        allowDrag={true}
        showToggleBtn={true}
        onFilesSelected={handleMediaSelection}
      />

      <AppButton
        variant="contained"
        onClick={handleNext}
        options={{
          disabled: isProcessing,
        }}
      >
        <TransText {...POST_BUTTON_LABELS.post_next} noComponent />
      </AppButton>
    </Box>
  );
};
