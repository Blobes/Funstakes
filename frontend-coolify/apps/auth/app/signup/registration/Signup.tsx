"use client";

import React from "react";
import { Box, Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  CLIENT_ROUTES,
  COMMON_FEEDBACK,
  BaseStyleProps,
} from "@repo/core";
import {
  AppButton,
  DynamicInput,
  PasswordInput,
  InlineMsgUI,
  ProgressUI,
  AnchorLink,
  UIGuide,
  PhoneInput,
  TransText,
  AppLogo,
} from "@repo/shared-ui";
import { useSignup } from "./useSignup";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";
import { OAuthProviders } from "../../oauth/Providers";
import { autoScroll } from "@repo/helpers";

interface SignupProps {
  style?: BaseStyleProps;
}

/**
 * Unified registration layout showing inputs, country selector popups, and real-time password feedback.
 */
export const Signup: React.FC<SignupProps> = ({ style = {} }) => {
  const theme = useTheme();
  const { INPUT_GUIDES } = useGuides();

  const {
    email,
    phone,
    password,
    emailValidity,
    emailValidationMsg,
    phoneValidity,
    phoneValidationMsg,
    handleEmailChange,
    handleClearEmail,
    handlePhoneChange,
    handlePasswordChange,
    passwordVisualStates,
    handleSubmit,
    isSubmitLoading,
    isSubmitDisabled,
    inlineMsg,
    handleAnchorNavigation,
    clearInlineMsg,
  } = useSignup();

  const { translateTxtString } = useStaticTranslation();

  const inlineLinkStyle = {
    color: theme.palette.primary.dark,
    flex: "none",
    "&:hover": {
      color: theme.palette.primary.dark,
      textDecoration: "underline",
      fontWeight: 600,
      borderRadius: theme.radius[8],
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        ...autoScroll().base, // Has height
        width: "50%",
        minWidth: 420,
        padding: theme.boxSpacing(18),
        alignItems: "center",
        flexDirection: "column",
        ...(style?.itemWrapper as any),
        [theme.breakpoints.down("md")]: {
          height: "100svh",
          width: "80%",
          minWidth: "unset",
          minHeight: "fit-content",
          flex: "none",
          scrollSnapAlign: "start",
          padding: theme.boxSpacing(20, 10),
          overflow: "unset",
          ...style.itemWrapper?.mdScreen,
        },
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          minWidth: "unset",
          ...style.itemWrapper?.smScreen,
        },
      }}
    >
      <Stack
        sx={{
          width: "100%",
          maxWidth: 420,
          margin: "auto 0",
          gap: theme.gap(8),
        }}
      >
        <AppLogo
          color={theme.palette.gray[300]}
          style={{
            itemWrapper: {
              alignSelf: "center",
              marginBottom: theme.boxSpacing(8),
            },
          }}
        />
        <Stack
          gap={theme.gap(4)}
          sx={{
            width: "100%",
            paddingBottom: theme.boxSpacing(6),
            [theme.breakpoints.down("md")]: {
              paddingBottom: theme.boxSpacing(12),
            },
          }}
        >
          <TransText
            {...COMMON_FEEDBACK.create_an_account}
            component="h3"
            breakWord
            sx={{
              ...theme.typography.h6,
              color: theme.palette.gray[300],
              textAlign: "center",
              ...style.headline,
            }}
          />
          <TransText
            {...COMMON_FEEDBACK.user_terms_agreement_signup}
            component="p"
            inlineComponents={{
              agreement: (
                <AnchorLink
                  href={CLIENT_ROUTES.terms.path}
                  onClick={(e: React.MouseEvent) =>
                    handleAnchorNavigation?.(e, CLIENT_ROUTES.terms)
                  }
                  style={inlineLinkStyle}
                />
              ),
              policy: (
                <AnchorLink
                  href={CLIENT_ROUTES.privacy.path}
                  onClick={(e: React.MouseEvent) =>
                    handleAnchorNavigation?.(e, CLIENT_ROUTES.privacy)
                  }
                  style={inlineLinkStyle}
                />
              ),
            }}
            sx={{
              ...theme.typography.text5,
              color: theme.palette.gray[200],
              paddingBottom: theme.boxSpacing(2),
              textAlign: "center",
              ...style.tagline,
            }}
          />
        </Stack>

        {/* Third Party Providers */}
        <OAuthProviders
          purpose="REGISTRATION"
          autoPromptGoogle={true}
          isAppAuthLoading={isSubmitLoading}
        />

        <Divider
          sx={{
            ...theme.typography.text5,
            color: theme.palette.gray[200],
            width: "100%",
            margin: 0,
          }}
        >
          <TransText {...AUTH_FEEDBACK.or_sign_up_with} noComponent />
        </Divider>

        {inlineMsg && (
          <InlineMsgUI scrollIntoView={true} msg={inlineMsg} type="ERROR" />
        )}

        {/* Input Fields Form Container */}
        <Stack
          sx={{ gap: theme.gap(6), width: "100%" }}
          component="form"
          onSubmit={handleSubmit}
          noValidate
        >
          <DynamicInput
            required
            value={email}
            type="email"
            label={translateTxtString(AUTH_INPUT.label.email_address)}
            placeholder={translateTxtString(
              AUTH_INPUT.placeholder.enter_your_email,
            )}
            onChange={handleEmailChange}
            onClear={handleClearEmail}
            helperText={emailValidationMsg}
            error={email !== "" && emailValidity === "INVALID"}
          />

          <PhoneInput
            value={phone}
            label={translateTxtString(AUTH_INPUT.label.phone_optional)}
            placeholder={translateTxtString(
              AUTH_INPUT.placeholder.phone_example,
            )}
            includeCountryCode={true}
            onPhoneChange={handlePhoneChange}
            onClearInlineMsg={clearInlineMsg}
            helperText={phoneValidationMsg}
            error={phone !== "" && phoneValidity === "INVALID"}
          />

          <PasswordInput
            required
            label={translateTxtString(AUTH_INPUT.label.password)}
            placeholder={translateTxtString(
              AUTH_INPUT.placeholder.create_password,
            )}
            onChange={handlePasswordChange}
            value={password}
            inputGuideUI={
              <UIGuide
                guides={[INPUT_GUIDES.PASSWORD]}
                showTitle={false}
                detailVisuals={passwordVisualStates}
                containerStyle={{
                  backgroundColor: theme.palette.gray.trans[1],
                  borderRadius: theme.radius[12],
                }}
              />
            }
          />

          <AppButton
            variant="contained"
            submit
            style={{
              width: "100%",
              marginTop: theme.gap(4),
            }}
            options={{ disabled: isSubmitDisabled || isSubmitLoading }}
          >
            {isSubmitLoading ? (
              <ProgressUI options={{ size: 25 }} />
            ) : (
              <TransText {...AUTH_BUTTON_LABELS.signup} noComponent />
            )}
          </AppButton>
        </Stack>
        <Stack
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: theme.boxSpacing(8),
            gap: theme.gap(2),
          }}
        >
          <TransText
            {...AUTH_FEEDBACK.already_have_an_account}
            component="p"
            sx={{
              ...theme.typography.text4,
              textAlign: "center",
              ...style.tagline,
            }}
          />
          <AnchorLink
            onClick={(e: React.MouseEvent) =>
              handleAnchorNavigation?.(e, CLIENT_ROUTES.login)
            }
            href={CLIENT_ROUTES.login.path}
            style={{
              ...inlineLinkStyle,
            }}
          >
            <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
          </AnchorLink>
        </Stack>
      </Stack>
    </Box>
  );
};
