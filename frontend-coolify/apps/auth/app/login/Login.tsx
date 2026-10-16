"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { IStep, AuthStepName, InputType } from "@repo/core";
import { DisplayFeedbackUI, Stepper } from "@repo/shared-ui";
import { PasswordStep } from "./PasswordStep";
import { IdentifierStep } from "./IdentifierStep";
import { LoginProps } from "../types";
import { autoScroll } from "@repo/helpers";

export const Login: React.FC<LoginProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<InputType>("UNKNOWN");
  const [currStep, setCurrStep] = useState<AuthStepName>("IDENTIFIER");

  const steps = useMemo<IStep<AuthStepName>[]>(
    () => [
      {
        name: "IDENTIFIER",
        element: (
          <IdentifierStep
            step={currStep}
            setStep={setCurrStep}
            existingInput={input}
            setInputType={setInputType}
            setIdentifier={setInput}
            style={{
              headline: style?.headline,
              tagline: style?.tagline,
              //  wrapper: style.wrapper,
            }}
          />
        ),
      },
      {
        name: "RESTORE_ACCOUNT",
        element: <DisplayFeedbackUI type="NEEDS_RESTORE" />,
      },
      {
        name: "PASSWORD",
        element: (
          <PasswordStep
            step={currStep}
            setStep={setCurrStep}
            identifier={input}
            inputType={inputType}
            style={{
              headline: style?.headline,
              tagline: style?.tagline,
              // wrapper: style.wrapper,
            }}
          />
        ),
      },
    ],
    [currStep, input, inputType, style?.headline, style?.tagline],
  );

  return (
    <Stepper
      steps={steps}
      currStep={currStep}
      setCurrStep={setCurrStep}
      style={{
        itemWrapper: {
          ...autoScroll().base, // Has height
          width: "50%",
          minWidth: 420,
          padding: theme.boxSpacing(20),
          alignItems: "center",
          ...style.itemWrapper,
          [theme.breakpoints.down("md")]: {
            flex: "none",
            height: "100svh",
            width: "80%",
            minWidth: "unset",
            minHeight: "fit-content",
            justifyContent: "center",
            scrollSnapAlign: "start",
            padding: theme.boxSpacing(20, 10),
            overflow: "unset",
            ...style.itemWrapper?.mdScreen,
          },
          [theme.breakpoints.down("sm")]: {
            width: "100%",
            ...style.itemWrapper?.smScreen,
          },
        },
        item: { margin: "auto auto", maxWidth: 420 },
      }}
    />
  );
};
