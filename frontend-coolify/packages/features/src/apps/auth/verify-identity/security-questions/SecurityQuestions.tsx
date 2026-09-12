"use client";

import React from "react";
import { TransitPurpose } from "@repo/core";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { SetupSecurityQuestions } from "./SetupQuestions";
import { VerifySecurityQuestions } from "./VerifyQuestions";

/**
 * Parent component routing between security question setup and verification views.
 */
export const SecurityQuestions = <P extends TransitPurpose>(
  props: BaseVerificationProps<P>,
) => {
  const isMfaActivation = props.activeTransit?.purpose === "MFA_ACTIVATION";
  if (isMfaActivation) {
    return <SetupSecurityQuestions {...props} />;
  }
  return <VerifySecurityQuestions {...props} />;
};
