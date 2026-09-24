"use client";

import React, { useMemo } from "react";
import { Divider, Stack } from "@mui/material";
import {
  AppButton,
  DynamicInput,
  InlineMsgUI,
  ProgressUI,
  DisplayList as CountryList,
  UIGuide as CredentialGuide,
  SVGWrapper,
  AnchorLink,
  TransText,
  AppLogo,
} from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_FEEDBACK,
  AUTH_INPUT,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  ICountryItem,
  LISTS,
  ListType,
} from "@repo/core";
import { useIdentifier } from "./hooks/useIdentifier";
import { LoginProps } from "../types";
import { asset } from "@repo/assets";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";
import { useLogin } from "./hooks/useLogin";
import { useOAuth } from "../oauth/useOauth";

export const IdentifierStep: React.FC<LoginProps> = ({
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();
  const { handleResetPassClick } = useLogin({});

  const { handleGoogleRedirectSignIn, handleAppleSignIn, isOAuthLoading } =
    useOAuth({
      purpose: "LOGIN",
      autoPromptGoogle: true,
    });

  const inlineTxtStyle = useMemo(
    () => ({
      color: theme.palette.primary.dark,
      flex: "none",
      "&:hover": {
        textDecoration: "underline",
        fontWeight: 600,
      },
    }),
    [theme],
  );

  const {
    input,
    setInput,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled,
    countryMenuRef,
    validateAndSet,
    handleSignupClick,
    inlineMsg,
  } = useIdentifier({
    existingInput,
    setStep,
    setIdentifier,
    inlineTxtStyle,
    handleResetPassClick,
  });

  const isGlobalLoading = isAuthLoading || isOAuthLoading;

  return (
    <Stack gap={theme.gap(8)}>
      <AppLogo color={theme.palette.gray[300]} sx={{ alignSelf: "center" }} />
      <Stack
        gap={theme.gap(8)}
        sx={{
          paddingBottom: theme.boxSpacing(6),
          [theme.breakpoints.down("md")]: {
            paddingBottom: theme.boxSpacing(12),
          },
        }}
      >
        <TransText
          {...COMMON_FEEDBACK.sign_in_to_funstakes}
          component="h3"
          sx={{
            ...theme.typography.h6,
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...COMMON_FEEDBACK.user_terms_agreement}
          inlineComponents={{
            agreement: (
              <AnchorLink href="/user-agreement" style={inlineTxtStyle} />
            ),
            policy: (
              <AnchorLink href="/privacy-policy" style={inlineTxtStyle} />
            ),
          }}
          sx={{
            ...theme.typography.text4,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(2),
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {/* 3rd party sign in */}
      <Stack direction="row">
        <AppButton
          variant="outlined"
          onClick={handleGoogleRedirectSignIn}
          style={{
            gap: theme.gap(4),
            width: "100%",
          }}
          options={{ disabled: isGlobalLoading }}
        >
          <SVGWrapper
            src={asset.googleLogo}
            size={20}
            fallbackUIType="SKELETON"
          />
          Google
        </AppButton>
        <AppButton
          variant="outlined"
          onClick={handleAppleSignIn}
          style={{
            gap: theme.gap(4),
            width: "100%",
          }}
          options={{ disabled: isGlobalLoading }}
        >
          <SVGWrapper
            src={asset.appleLogo}
            size={20}
            color={theme.palette.gray[300]}
            fallbackUIType="SKELETON"
          />
          Apple
        </AppButton>
      </Stack>

      <Divider
        sx={{
          ...theme.typography.text5,
          color: theme.palette.gray[200],
          margin: theme.gap(4),
        }}
      >
        <TransText {...AUTH_FEEDBACK.or_sign_in_with} noComponent />
      </Divider>

      {/* Feedback */}
      {inlineMsg && <InlineMsgUI msg={inlineMsg} type="ERROR" />}

      {/* In app sign in */}
      <Stack
        sx={{ gap: theme.gap(10), paddingBottom: theme.boxSpacing(8) }}
        component="form"
        onSubmit={handleSubmit}
      >
        <DynamicInput
          required
          value={input}
          label={translateTxtString(AUTH_INPUT.label.email_phone_username)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.email_phone_username,
          )}
          onChange={handleChange}
          helperText={validationMsg}
          error={input !== "" && validity === "INVALID"}
          tooltipGuide={
            <CredentialGuide
              guides={[
                INPUT_GUIDES.EMAIL,
                INPUT_GUIDES.PHONE,
                INPUT_GUIDES.USERNAME,
              ]}
            />
          }
        />
        {/* Country list popup */}
        <CountryList<ICountryItem>
          menuRef={countryMenuRef}
          list={COUNTRY_LIST}
          listName={ListType.COUNTRY}
          showSearchBar
          heightThreshold={64}
          adaptToParentWidth
          style={{
            item: {
              padding: theme.boxSpacing(4, 8),
              gap: "10px",
              borderRadius: 0,
              "& svg": { width: "16px", height: "16px" },
            },
            container: {
              padding: 0,
            },
          }}
          onItemClick={(item) => {
            if (item?.code) {
              const newValue = `(+${item.code.replace(/\+/g, "")}) `;
              setInput(newValue);
              validateAndSet(newValue);
            }
          }}
        />
        <AppButton
          variant="contained"
          submit
          style={{
            width: "100%",
          }}
          options={{ disabled: isSubmitDisabled || isGlobalLoading }}
        >
          {isAuthLoading ? (
            <ProgressUI options={{ size: 25 }} />
          ) : (
            <TransText {...COMMON_BUTTON_LABELS.continue} noComponent />
          )}
        </AppButton>
      </Stack>

      {/* Footer */}
      <Stack sx={{ gap: theme.gap(10), alignItems: "center" }}>
        <TransText
          {...COMMON_FEEDBACK.new_to_funstakes}
          component="p"
          sx={{ ...theme.typography.text4, textAlign: "center" }}
          inlineComponents={{
            anchor: (
              <AnchorLink
                href={CLIENT_ROUTES.signup.path}
                onClick={handleSignupClick}
                style={{
                  ...inlineTxtStyle,
                }}
              />
            ),
          }}
        />
        <AnchorLink
          href={CLIENT_ROUTES.resetPassword.path}
          onClick={handleResetPassClick}
          style={{
            ...inlineTxtStyle,
          }}
        >
          <TransText {...COMMON_BUTTON_LABELS.reset_password} noComponent />
        </AnchorLink>
      </Stack>
    </Stack>
  );
};
