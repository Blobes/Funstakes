"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ApiError,
  COMMON_FEEDBACK,
  COMMON_MEDIA,
  CustomizedMedia,
  MediaUploadPayload,
  MenuRef,
  POST_FEEDBACK,
  PostStepName,
  SNACKBAR_DURATION,
  StepperProps,
  useGlobalStore,
} from "@repo/core";
import { uploadMediaToCloud } from "@repo/helpers";
import {
  useFileProcessing,
  useMediaFileTransform,
  useSnackbar,
  useStaticTranslation,
} from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { GistService } from "../gistService";
import { useTopics } from "../../post/hooks/useTopics";
import { MediaUploadTracker, ProgressIcon } from "@repo/shared-ui";
import { useSocketListener } from "@repo/shared-hooks";

export interface Content extends StepperProps<PostStepName> {
  caption: string;
  setCaption: (val: string) => void;
  topics: string[];
  setTopics: (val: string[]) => void;
  hasSensitiveGraphic?: boolean;
  setHasSensitiveGraphic?: (val: boolean) => void;
}

export interface FilesProps {
  stagedFiles: File[];
  setStagedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

/**
 * Handles form states, trust boundary bypass logic, and upload serialization for a Gist post.
 */
export const useGistContent = ({
  setStep,
  caption,
  setCaption,
  stagedFiles,
  setStagedFiles,
  topics,
  setTopics,
  hasSensitiveGraphic = false,
  setHasSensitiveGraphic,
}: Content & FilesProps) => {
  const { createGist } = GistService();
  const { setSBMessage } = useSnackbar();
  const { translateTxtString } = useStaticTranslation();

  const topicsMenuRef = useRef<MenuRef>(null);

  const authUser = useGlobalStore((state) => state.authUser);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inlineErrMsg, setInlineErrMsg] = useState<React.ReactNode | null>(
    null,
  );
  const [customizationsMap, setCustomizationsMap] = useState<
    Record<string, CustomizedMedia>
  >({});
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);

  const [moderationTrackingId, setModerationTrackingId] = useState<
    string | null
  >(null);

  const topicOperations = useTopics({ topics, setTopics });

  /**
   * Transforms raw browser files into structured IMedia models.
   */
  const transformedMediaList = useMediaFileTransform({
    files: stagedFiles,
    customizationsMap,
  });

  const {
    isProcessingLocal,
    processingStates,
    handleSelectedFiles,
    handleRemoveFile,
  } = useFileProcessing({
    stagedFiles,
    setStagedFiles,
    setErrorMessage,
  });

  const userHasFlags = authUser?.hasFlaggedPost ?? false;
  const userWindowCount = authUser?.postCountWindow ?? 0;
  const skipModeration = !userHasFlags && userWindowCount >= 6;

  /**
   * Listens for real-time moderation updates broadcasted by backend workers.
   */
  useSocketListener("GIST_STATUS_UPDATE", (data: any) => {
    if (!moderationTrackingId || data.payload?.gistId !== moderationTrackingId)
      return;

    const { status } = data.payload;

    if (status === "PUBLISHED" || status === "SHADOWBANNED") {
      setSBMessage({
        msg: {
          msgStatus: "SUCCESS",
          headline: translateTxtString(
            POST_FEEDBACK.processing_complete_headline,
          ),
          tagline: translateTxtString(
            status === "SHADOWBANNED"
              ? POST_FEEDBACK.processing_complete_tagline("Gist")
              : POST_FEEDBACK.published_success_tagline("Gist"),
          ),
          behavior: "TIMED",
          duration: SNACKBAR_DURATION.SECS_6,
          hasClose: true,
        },
      });
      setModerationTrackingId(null);
    }
  });

  /**
   * Listens for real-time rejections from backend safety checking.
   */
  useSocketListener("CONTENT_REJECTED", (data: any) => {
    if (!moderationTrackingId || data.postId !== moderationTrackingId) return;

    setSBMessage({
      msg: {
        msgStatus: "ERROR",
        headline: translateTxtString(POST_FEEDBACK.content_rejected_headline),
        tagline: translateTxtString(
          data.reason
            ? POST_FEEDBACK.content_rejected_tagline(data.reason as string)
            : POST_FEEDBACK.content_violation_tagline,
        ),
        behavior: "TIMED",
        duration: SNACKBAR_DURATION.SECS_6,
        hasClose: true,
      },
    });
    setModerationTrackingId(null);
  });

  useEffect(() => {
    if (errorMessage) {
      setSBMessage({
        msg: {
          id: `gist-err-${Date.now()}`,
          msgStatus: "ERROR",
          tagline:
            errorMessage ||
            translateTxtString(POST_FEEDBACK.creation_failed_tagline("Gist")),
          behavior: "TIMED",
          hasClose: true,
          duration: SNACKBAR_DURATION.SECS_6,
        },
      });
    }
  }, [errorMessage, setSBMessage]);

  /**
   * Displays direct upload progress metrics.
   */
  useEffect(() => {
    if (moderationTrackingId) return;

    const stateEntries = Object.entries(processingStates);
    if (stateEntries.length === 0) return;

    const uploadStatesOnly = Object.fromEntries(
      stateEntries
        .filter(([_, data]) => data.upload)
        .map(([id, data]) => [id, data.upload!]),
    );

    const hasActiveUploads = Object.values(uploadStatesOnly).some(
      (state) => state.status === "UPLOADING",
    );

    if (Object.keys(uploadStatesOnly).length === 0) return;

    setSBMessage({
      msg: {
        id: "media-upload",
        msgStatus: "INFO",
        headline: translateTxtString(COMMON_MEDIA.media_transfer_progress),
        customContent: <MediaUploadTracker uploadStates={uploadStatesOnly} />,
        behavior: hasActiveUploads ? "FIXED" : "TIMED",
        duration: hasActiveUploads ? undefined : SNACKBAR_DURATION.SECS_6,
      },
    });
  }, [processingStates, moderationTrackingId, setSBMessage]);

  useEffect(() => {
    if (!moderationTrackingId) return;

    setSBMessage({
      msg: {
        id: `moderation-${moderationTrackingId}`,
        msgStatus: "INFO",
        headline: translateTxtString(COMMON_MEDIA.verifying_content_safeties),
        behavior: "FIXED",
        customContent: (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ProgressIcon options={{ size: 24 }} />
            <span>Analyzing text and attachments against system rules...</span>
          </div>
        ),
        duration: SNACKBAR_DURATION.SECS_6,
      },
    });
  }, [moderationTrackingId, setSBMessage]);

  const handleSaveCustomization = useCallback(
    (fileIndex: number, customizedData: CustomizedMedia) => {
      const targetFile = stagedFiles[fileIndex];
      if (!targetFile) return;

      const trackingId =
        (targetFile as any).trackingId || `${fileIndex}-${targetFile.name}`;

      setCustomizationsMap((prev) => ({
        ...prev,
        [trackingId]: customizedData,
      }));

      setStep?.("CONTENT");
      setEditingFileIndex(null);
    },
    [stagedFiles, setStep],
  );

  const { mutate: executePublish, isPending: isMutationLoading } = useMutation({
    mutationFn: async () => {
      const hasMedia = stagedFiles?.length > 0;
      let uploadedAssets: MediaUploadPayload[] = [];

      if (hasMedia) {
        uploadedAssets = await uploadMediaToCloud(
          stagedFiles,
          customizationsMap,
        );
      }

      const serverPayload = {
        caption: caption.trim().length > 0 ? caption.trim() : undefined,
        media: hasMedia ? uploadedAssets : undefined,
        topics: topics.length > 0 ? topics : undefined,
        hasSensitiveGraphic,
        skipModeration,
      };

      return await createGist(serverPayload);
    },
    onSuccess: (result: any) => {
      if (skipModeration) {
        setSBMessage({
          msg: {
            id: `gist-success-${Date.now()}`,
            msgStatus: "SUCCESS",
            tagline: translateTxtString(
              POST_FEEDBACK.published_success_tagline("Gist"),
            ),
            behavior: "TIMED",
            duration: SNACKBAR_DURATION.SECS_6,
            hasClose: true,
          },
        });
      } else {
        if (result?._id) {
          setModerationTrackingId(result._id);
        }
      }

      setStagedFiles([]);
      setCustomizationsMap({});
      setTopics([]);
      setHasSensitiveGraphic?.(false);
      setCaption("");
      setStep?.("CONTENT");
    },
    onError: (error: ApiError) => {
      console.error("Post publication failed:", error);
      const fallbackError = translateTxtString(
        COMMON_FEEDBACK.server_error_tagline,
      );
      const errorMsg = error.localizedErrMsg || error.message || fallbackError;
      setInlineErrMsg(errorMsg);
    },
  });

  const handleGistPublish = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();

      if (isProcessingLocal) {
        return;
      }

      const hasCaption = caption.trim().length > 0;
      const hasMedia = stagedFiles.length > 0;

      if (!hasCaption && !hasMedia) {
        setErrorMessage(
          translateTxtString(POST_FEEDBACK.post_content_validation("Gist")),
        );
        return;
      }
      setErrorMessage(null);
      executePublish();
    },
    [caption, stagedFiles, isProcessingLocal, executePublish],
  );

  const handleNext = useCallback(() => {
    if (isProcessingLocal) {
      return;
    }

    const hasCaption = caption.trim().length > 0;
    const hasMedia = stagedFiles.length > 0;

    if (!hasCaption && !hasMedia) {
      setErrorMessage(
        translateTxtString(POST_FEEDBACK.post_content_validation("Gist")),
      );
      return;
    }
    setErrorMessage(null);
    setStep?.("SETTINGS");
  }, [caption, stagedFiles, isProcessingLocal, setStep]);

  return {
    caption,
    setCaption,
    stagedFiles,
    transformedMediaList,
    customizationsMap,
    editingFileIndex,
    setEditingFileIndex,
    handleSaveCustomization,
    topics,
    setTopics,
    hasSensitiveGraphic,
    setHasSensitiveGraphic,
    isProcessing:
      isMutationLoading || !!moderationTrackingId || isProcessingLocal,
    inlineErrMsg,
    processingStates,
    handleSelectedFiles,
    handleRemoveFile,
    handleGistPublish,
    handleNext,
    topicsMenuRef,
    ...topicOperations,
  };
};
