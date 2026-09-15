"use client";

import React, { useMemo, useState } from "react";
import { Stepper } from "@repo/shared-ui";
import { IStep, TransitPurpose } from "@repo/core";
import { ConfigureTotp } from "./ConfigureTotp";
import { VerifyTotpCode } from "./VerifyTotpCode";
import { TotpViewStep, useTotp } from "./useTotp";
import { BaseVerificationProps } from "../useVerifyIdentity";
import { TotpActionType } from "../services";

export interface TotpViewProps<
  P extends TransitPurpose,
> extends BaseVerificationProps<P> {
  totpAction?: TotpActionType;
}

/**
 * Orchestrates TOTP views (configuration setup or code verification) using a stepper.
 */
export const TotpView = <P extends TransitPurpose>(props: TotpViewProps<P>) => {
  const { initialStep } = useTotp(props);
  const [currStep, setCurrStep] = useState<TotpViewStep>(initialStep);

  const steps = useMemo<IStep<TotpViewStep>[]>(
    () => [
      {
        name: "CONFIGURE_TOTP",
        element: (
          <ConfigureTotp
            currStep={currStep}
            setCurrStep={setCurrStep}
            {...props}
          />
        ),
      },
      {
        name: "VERIFY_TOTP_CODE",
        element: (
          <VerifyTotpCode
            currStep={currStep}
            setCurrStep={setCurrStep}
            {...props}
          />
        ),
      },
    ],
    [props],
  );

  return (
    <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
  );
};
