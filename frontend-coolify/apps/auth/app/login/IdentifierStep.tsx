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
  COUNTRY_LIST,
  ICountryItem,
  ListType,
} from "@repo/core";
import { useIdentifier } from "./hooks/useIdentifier";
import { LoginProps } from "../types";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";
import { useLogin } from "./hooks/useLogin";
import { OAuthProviders } from "../oauth/Providers";

export const IdentifierStep: React.FC<LoginProps> = ({
  setStep,
  existingInput,
  setIdentifier,
  style = {},
}) => {
  const theme = useTheme();
  const { translateTxtString } = useStaticTranslation();
  const { INPUT_GUIDES } = useGuides();
  const { handleResetPassClick } = useLogin({});

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
    handleAnchorNavigation,
    inlineMsg,
  } = useIdentifier({
    existingInput,
    setStep,
    setIdentifier,
    inlineTxtStyle,
    handleResetPassClick,
  });

  return (
    <Stack sx={{ width: "100%", gap: theme.gap(8) }}>
      <AppLogo
        color={theme.palette.gray[300]}
        style={{
          itemWrapper: {
            alignSelf: "center",
            marginBottom: theme.boxSpacing(10),
          },
        }}
      />
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
          {...COMMON_FEEDBACK.user_terms_agreement_login}
          inlineComponents={{
            agreement: (
              <AnchorLink
                href={CLIENT_ROUTES.terms.path}
                onClick={(e: React.MouseEvent) =>
                  handleAnchorNavigation?.(e, CLIENT_ROUTES.terms)
                }
                style={inlineTxtStyle}
              />
            ),
            policy: (
              <AnchorLink
                href={CLIENT_ROUTES.privacy.path}
                onClick={(e: React.MouseEvent) =>
                  handleAnchorNavigation?.(e, CLIENT_ROUTES.privacy)
                }
                style={inlineTxtStyle}
              />
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

      {/* Third Party Providers */}
      <OAuthProviders
        purpose="LOGIN"
        autoPromptGoogle={true}
        isAppAuthLoading={isAuthLoading}
      />

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
          list={COUNTRY_LIST()}
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
            itemWrapper: {
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
          options={{ disabled: isSubmitDisabled || isAuthLoading }}
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
                onClick={(e: React.MouseEvent) =>
                  handleAnchorNavigation?.(e, CLIENT_ROUTES.signup)
                }
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
