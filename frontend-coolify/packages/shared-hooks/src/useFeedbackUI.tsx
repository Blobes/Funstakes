"use client";

import React from "react";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  COMMON_BUTTON_LABELS,
  COMMON_FEEDBACK,
  DisplayFeedbackUIType,
  FeedbackProps,
} from "@repo/core";
import {
  ShieldCheck,
  Lock,
  Construction,
  Ban,
  UserPlus,
  RefreshCw,
  LucideShieldOff,
  Milestone,
  Unplug,
  CloudAlert,
} from "lucide-react";
import { usePage } from "./usePage";
import { useStaticTranslation } from "./useTrans";
import { useTheme } from "@mui/material/styles";

/**
 * Custom hook providing structured configuration contexts for application level restricted views.
 */
export const useDisplayFBConfig = (): Record<
  DisplayFeedbackUIType,
  FeedbackProps
> => {
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  return {
    ALREADY_LOGGED_IN: {
      headline: translateTxtString(AUTH_FEEDBACK.already_signed_in_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.already_signed_in_tagline),
      icon: <ShieldCheck />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
        action: () =>
          navigateTo(CLIENT_ROUTES.home, { type: "replace", loadPage: true }),
        href: CLIENT_ROUTES.home.path,
      },
    },
    PASSWORD_RESET_SUCCESS: {
      headline: translateTxtString(
        AUTH_FEEDBACK.password_reset_successful_headline,
      ),
      tagline: translateTxtString(
        AUTH_FEEDBACK.password_reset_successful_tagline,
      ),
      icon: <ShieldCheck />,
      primaryCta: {
        label: AUTH_BUTTON_LABELS.login.tValue,
        action: () =>
          navigateTo(CLIENT_ROUTES.login, { loadPage: true, savePage: false }),
      },
    },
    UNAUTHORIZED: {
      headline: translateTxtString(COMMON_FEEDBACK.access_denied_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.access_denied_tagline),
      icon: <LucideShieldOff />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    NETWORK_GLITCH: {
      headline: translateTxtString(COMMON_FEEDBACK.network_glitch_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.network_glitch_tagline),
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.refresh),
        variant: "outlined",
        action: () => window.location.reload(),
      },
      icon: <Unplug />,
      style: {
        container: {
          backgroundColor: "transparent",
          border: "none",
          [theme.breakpoints.up("md")]: {
            maxWidth: "40%",
          },
        },
        icon: {
          width: 60,
        },
      },
    },
    SERVER_ERROR: {
      headline: translateTxtString(COMMON_FEEDBACK.server_error_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.server_error_tagline),
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.refresh),
        variant: "outlined",
        action: () => window.location.reload(),
      },
      icon: <CloudAlert />,
      style: {
        container: {
          backgroundColor: "transparent",
          border: "none",
          [theme.breakpoints.up("md")]: {
            maxWidth: "40%",
          },
        },
        icon: {
          width: 60,
        },
      },
    },
    UNKNOWN: {
      icon: <Milestone />,
      style: {
        container: {
          backgroundColor: "transparent",
          border: "none",
          gap: theme.gap(6),
          [theme.breakpoints.up("md")]: {
            maxWidth: "40%",
          },
        },
      },
    },
    MAINTENANCE: {
      headline: translateTxtString(COMMON_FEEDBACK.under_maintenance_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.under_maintenance_tagline),
      icon: <Construction />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.go_home),
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    BANNED: {
      headline: translateTxtString(AUTH_FEEDBACK.account_suspended_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.account_suspended_tagline),
      icon: <Ban />,
      primaryCta: {
        label: translateTxtString(COMMON_BUTTON_LABELS.view_terms),
        action: () => navigateTo(CLIENT_ROUTES.terms, { loadPage: true }),
      },
    },
    NEEDS_LOGIN: {
      headline: translateTxtString(COMMON_FEEDBACK.access_restricted_headline),
      tagline: translateTxtString(COMMON_FEEDBACK.access_restricted_tagline),
      icon: <Lock />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.login_now),
        action: () =>
          navigateTo(CLIENT_ROUTES.login, { loadPage: true, savePage: false }),
      },
      secondaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.proceed),
        action: () => navigateTo(CLIENT_ROUTES.home, { loadPage: true }),
      },
    },
    NEEDS_OTP_VERIFICATION: {
      headline: translateTxtString(AUTH_FEEDBACK.verify_your_account_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.verify_your_account_tagline),
      icon: <UserPlus />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.otp_verify_code),
        action: () =>
          navigateTo(CLIENT_ROUTES.verifyIdentity, { loadPage: true }),
      },
    },
    NEEDS_ONBOARDING: {
      headline: translateTxtString(AUTH_FEEDBACK.finish_setting_up_headline),
      tagline: translateTxtString(AUTH_FEEDBACK.finish_setting_up_tagline),
      icon: <UserPlus />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.resume),
        action: () => navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true }),
      },
    },
    NEEDS_RESTORE: {
      headline: translateTxtString(AUTH_FEEDBACK.account_deactivated_headline),
      tagline: translateTxtString(
        AUTH_FEEDBACK.user_account_deactivated_tagline,
      ),
      icon: <RefreshCw />,
      primaryCta: {
        label: translateTxtString(AUTH_BUTTON_LABELS.restore_account),
        action: () =>
          navigateTo(CLIENT_ROUTES.restoreAccount, { loadPage: true }),
      },
    },
  };
};
