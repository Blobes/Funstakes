"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { AppLogo, Stepper } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import { IStep, PasswordResetStepName } from "@repo/core";
import { CredentialStep } from "./Credential";
import { NewPasswordStep } from "./NewPassword";
import { ResetStepProps } from "../types";

/**
 * Top level controller switching presentation stages via unified linear routing matrices.
 */
export const Reset: React.FC<ResetStepProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [currStep, setCurrStep] = useState<PasswordResetStepName>("CREDENTIAL");

  const steps = useMemo<IStep<PasswordResetStepName>[]>(
    () => [
      {
        name: "CREDENTIAL",
        element: (
          <CredentialStep
            step={currStep}
            setStep={setCurrStep}
            existingInput={input}
            setIdentifier={setInput}
            style={{
              headline: style?.headline,
              tagline: style?.tagline,
            }}
          />
        ),
      },
      {
        name: "NEW_PASSWORD",
        element: (
          <NewPasswordStep
            step={currStep}
            setStep={setCurrStep}
            style={{
              headline: style?.headline,
              tagline: style?.tagline,
            }}
          />
        ),
      },
    ],
    [currStep, input, style?.headline, style?.tagline],
  );

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray[0],
        borderRadius: theme.radius[5],
        paddingY: theme.boxSpacing(14),
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(10),
        width: "40%",
        maxWidth: 400,
        ...style.container,
        [theme.breakpoints.down("md")]: {
          width: "60%",
          maxWidth: "unset",
          flex: "none",
          ...style.container?.mdScreen,
        },
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          maxWidth: "unset",
        },
      }}
    >
      <AppLogo
        size={50}
        color={theme.palette.gray[300]}
        sx={{ alignSelf: "center" }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
