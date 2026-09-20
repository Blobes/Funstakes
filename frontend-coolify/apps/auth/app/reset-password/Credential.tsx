"use client";

import React from "react";
import { Stack } from "@mui/material";
import {
  AppButton,
  DynamicInput,
  InlineMsgUI,
  ProgressUI,
  DisplayList as CountryList,
  UIGuide as CredentialGuide,
  TransText,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  COMMON_BUTTON_LABELS,
  ICountryItem,
  LISTS,
  ListType,
} from "@repo/core";
import { ArrowLeft } from "lucide-react";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";
import { useReset } from "./useReset";
import { ResetStepProps } from "../types";

/**
 * Primary identity resolution view checking credentials and binding target identifiers.
 */
export const CredentialStep: React.FC<ResetStepProps> = ({
  step,
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();

  const {
    input,
    setInput,
    validity,
    validationMsg,
    isStandardLoading,

    handleChange,
    isResetInitSubmitDisabled: isSubmitDisabled,
    countryMenuRef,
    inlineMsg,
    validateAndSet,
    handleStandardSubmit,
    handleTotpClick,
    hasTotp,
    handleBack,
  } = useReset({ existingInput, step, setStep });

  return (
    <Stack
      sx={{
        gap: theme.gap(10),
      }}
    >
      <Stack
        sx={{
          paddingBottom: theme.boxSpacing(18),
          gap: theme.gap(8),
        }}
      >
        <TransText
          {...AUTH_FEEDBACK.reset_your_password}
          component="h3"
          sx={{
            ...theme.typography.h6,
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...AUTH_FEEDBACK.provide_password_credential}
          component="p"
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {inlineMsg && <InlineMsgUI msg={inlineMsg} type="ERROR" />}

      {/* Form */}
      <Stack
        sx={{ gap: theme.gap(20) }}
        component="form"
        onSubmit={handleStandardSubmit}
      >
        <DynamicInput
          value={input}
          label={translateTxtString(AUTH_INPUT.label.email__or_phone)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.email_or_phone,
          )}
          onChange={handleChange}
          helperText={validationMsg}
          error={input !== "" && validity === "INVALID"}
          tooltipGuide={
            <CredentialGuide
              guides={[INPUT_GUIDES.EMAIL, INPUT_GUIDES.PHONE]}
            />
          }
        />
        <CountryList<ICountryItem>
          menuRef={countryMenuRef}
          list={COUNTRY_LIST}
          listName={ListType.COUNTRY}
          showSearchBar
          stickToScreen={false}
          heightThreshold={65}
          style={{
            item: {
              padding: theme.boxSpacing(4, 8),
              gap: "10px",
              borderRadius: 0,
              "& svg": { width: "16px", height: "16px" },
            },
            container: { padding: 0 },
          }}
          onItemClick={(item) => {
            if (item?.code) {
              const newValue = `(+${item.code.replace(/\+/g, "")}) `;
              setInput(newValue);
              validateAndSet(newValue);
              setIdentifier?.(newValue);
            }
          }}
        />

        <Stack sx={{ gap: theme.gap(10), alignItems: "center" }}>
          {/* OTP Submit CTA */}
          <AppButton
            variant="contained"
            submit
            style={{
              width: "100%",
            }}
            options={{ disabled: isSubmitDisabled }}
          >
            {isStandardLoading ? (
              <ProgressUI options={{ size: 25 }} />
            ) : (
              <TransText {...COMMON_BUTTON_LABELS.continue} noComponent />
            )}
          </AppButton>

          {/*  Totp navigation CTA */}
          <AppButton
            variant="outlined"
            onClick={handleTotpClick}
            style={{
              width: "100%",
            }}
            options={{ disabled: isSubmitDisabled || hasTotp }}
          >
            <TransText
              {...AUTH_BUTTON_LABELS.verify_with_authenticator}
              noComponent
            />
          </AppButton>

          {/* Back to Login CTA */}

          <AppButton
            variant="text"
            size="small"
            onClick={handleBack}
            options={{ disabled: isStandardLoading }}
            style={{
              color: theme.palette.primary.dark,
              marginTop: theme.boxSpacing(6),
              gap: theme.gap(3),
            }}
          >
            <ArrowLeft
              size={20}
              style={{ stroke: theme.palette.primary.dark }}
            />
            <TransText {...AUTH_BUTTON_LABELS.back_to_login} noComponent />
          </AppButton>
        </Stack>
      </Stack>
    </Stack>
  );
};
