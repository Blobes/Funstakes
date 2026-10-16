"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { IStep, PostStepName, StepperProps } from "@repo/core";
import { MediaCustomizer, Stepper } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import { GistContentStep } from "./GistContentStep";
import { GistSettingsStep } from "./GistSettingsStep";
import { useGistContent } from "./useGistContent";
import { CreatePostMediaPreview } from "../../post/components/MediaPreview";

export type GistContext = ReturnType<typeof useGistContent>;

/**
 * Handles workflow routing and multi-step state allocation for compiling a Gist.
 */
export const CreateGist: React.FC<StepperProps<PostStepName>> = ({
  style = {},
  modalRef,
  redirectTo,
}) => {
  const theme = useTheme();

  const [step, setStep] = useState<PostStepName>("CONTENT");

  // Shared structural values matching form lifecycle boundaries
  const [caption, setCaption] = useState("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [hasSensitiveGraphic, setHasSensitiveGraphic] = useState(false);

  const gistContentContext = useGistContent({
    step,
    setStep,
    caption,
    setCaption,
    stagedFiles,
    setStagedFiles,
    topics,
    setTopics,
    hasSensitiveGraphic,
    setHasSensitiveGraphic,
  });

  const { transformedMediaList, editingFileIndex, handleSaveCustomization } =
    gistContentContext;

  const currentMediaToCustomize =
    editingFileIndex !== null ? transformedMediaList[editingFileIndex] : null;

  const steps = useMemo<IStep<PostStepName>[]>(
    () => [
      {
        name: "CONTENT",
        element: (
          <GistContentStep
            step={step}
            setStep={setStep}
            caption={caption}
            setCaption={setCaption}
            stagedFiles={stagedFiles}
            setStagedFiles={setStagedFiles}
            topics={topics}
            setTopics={setTopics}
            gistContext={gistContentContext}
          />
        ),
      },
      {
        name: "SETTINGS",
        element: (
          <GistSettingsStep
            step={step}
            setStep={setStep}
            hasSensitiveGraphic={hasSensitiveGraphic}
            setHasSensitiveGraphic={setHasSensitiveGraphic}
            isProcessing={gistContentContext.isProcessing}
            inlineErrMsg={gistContentContext.inlineErrMsg}
            handleGistPublish={gistContentContext.handleGistPublish}
          />
        ),
      },
      {
        name: "MEDIA_PREVIEW",
        element: <CreatePostMediaPreview stagedFiles={stagedFiles} />,
      },
      {
        name: "MEDIA_CUSTOMIZATION",
        element: currentMediaToCustomize ? (
          <MediaCustomizer
            media={currentMediaToCustomize}
            onSave={(customizedMedia) => {
              if (editingFileIndex !== null) {
                handleSaveCustomization(editingFileIndex, customizedMedia);
              }
            }}
          />
        ) : null,
      },
    ],
    [
      step,
      caption,
      stagedFiles,
      topics,
      gistContentContext,
      hasSensitiveGraphic,
      currentMediaToCustomize,
      editingFileIndex,
      handleSaveCustomization,
    ],
  );

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray[50],
        borderRadius: theme.radius[20],
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(10),
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          ...style.itemWrapper?.mobiles,
        },
        ...style.itemWrapper,
      }}
    >
      <Stepper steps={steps} currStep={step} setCurrStep={setStep} />
    </Stack>
  );
};
