"use client";

import React from "react";
import { ConfirmAction } from "@repo/shared-ui";
import { useMisc, useStaticTranslation } from "@repo/shared-hooks";
import { CloverIcon } from "lucide-react";
import { AUTH_BUTTON_LABELS, AUTH_FEEDBACK, CLIENT_ROUTES } from "@repo/core";
import { useVerificationNavigation } from "./useNavigation";

export const ConfirmSessionTermination = () => {
  const { closeModal } = useMisc();
  const { clearTemporarySession, isTerminatingSession } =
    useVerificationNavigation();
  const { translateTxtString } = useStaticTranslation();

  const confirmTermination = async () => {
    await clearTemporarySession({ returnPage: CLIENT_ROUTES.login });
    closeModal();
  };

  return (
    <ConfirmAction
      icon={<CloverIcon size={32} />}
      headline={translateTxtString(AUTH_FEEDBACK.session_termination_headline)}
      tagline={translateTxtString(AUTH_FEEDBACK.session_termination_tagline)}
      confirmLabel={translateTxtString(AUTH_BUTTON_LABELS.terminate_session)}
      cancelLabel={translateTxtString(AUTH_BUTTON_LABELS.not_yet)}
      onConfirm={confirmTermination}
      onCancel={closeModal}
      isLoading={isTerminatingSession}
    />
  );
};
