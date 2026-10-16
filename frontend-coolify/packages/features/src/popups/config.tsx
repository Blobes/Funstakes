"use client";

import React from "react";
import { DrawerProps, ModalProps } from "@repo/core";
import { ComfirmLogout } from "../apps/auth/logout/Logout";
import { Theme } from "@mui/material/styles";
import { AppLogo, DisplayFeedbackUI } from "@repo/shared-ui";
import { ConfirmSessionTermination } from "../apps/auth/verify-identity/Session";

export type PopupName =
  | "CONFIRM_LOGOUT"
  | "CONFIRM_LOGIN_OR_SIGNUP"
  | "GIST_MEDIA_VIEW"
  | "CREATE_POST"
  | "WEB_MOBILE_MENU"
  | "APP_MOBILE_MENU"
  | "RESET_PASSWORD_SUCCESS"
  | "CONFIRM_SESSION_TERMINATION";
export type PopupType = "MODAL" | "DRAWER";

export interface PopupConfig {
  type: { baseScreen?: PopupType; smallScreen?: PopupType };
  modal?: ModalProps;
  drawer?: DrawerProps;
}

interface ConfigContext {
  content?: React.ReactNode;
  header?: React.ReactNode;
  closeModal: () => void;
  closeDrawer: () => void;
  theme: Theme;
}

/**
 * Returns configuration schemas for target window items based on contextual close parameters.
 */
export const POPUP_CONFIG = ({
  content,
  header,
  closeModal,
  closeDrawer,
  theme,
}: ConfigContext): Record<PopupName, PopupConfig> => {
  return {
    CONFIRM_LOGOUT: {
      type: { baseScreen: "MODAL" },
      modal: { content: <ComfirmLogout />, onClose: closeModal },
    },

    CONFIRM_LOGIN_OR_SIGNUP: {
      type: { baseScreen: "MODAL" },
      modal: { content, onClose: closeModal },
    },

    CONFIRM_SESSION_TERMINATION: {
      type: { baseScreen: "MODAL" },
      modal: { content: <ConfirmSessionTermination />, onClose: closeModal },
    },

    RESET_PASSWORD_SUCCESS: {
      type: { baseScreen: "MODAL" },
      modal: {
        content: <DisplayFeedbackUI type="PASSWORD_RESET_SUCCESS" />,
        onClose: closeModal,
      },
    },

    GIST_MEDIA_VIEW: {
      type: { baseScreen: "MODAL" },
      modal: { content, onClose: closeModal },
    },

    CREATE_POST: {
      type: { baseScreen: "MODAL" },
      modal: {
        content,
        onClose: closeModal,
        style: {
          overlay: {
            base: { padding: theme.boxSpacing(6), display: "none" },
            smScreen: {
              padding: 0,
              display: "flex",
            },
          },
          itemWrapper: {
            base: { height: "100%", borderRadius: 0 },
          },
          header: {
            justifyContent: "space-between",
            padding: theme.boxSpacing(5, 8),
          },
        },
      },
    },

    WEB_MOBILE_MENU: {
      type: { smallScreen: "DRAWER" },
      drawer: {
        content,
        source: "navbar",
        header: <AppLogo size={28} />,
        onClose: closeDrawer,
        style: {
          overlay: { base: { justifyContent: "flex-start" } },
          item: { base: { padding: theme.boxSpacing(8, 4) } },
          itemWrapper: {
            mdScreen: {
              width: "fit-content",
            },
            smScreen: {
              height: "100%",
              width: "100%",
              borderRadius: 0,
            },
          },
          header: {
            padding: theme.boxSpacing(8, 4, 4, 10),
            justifyContent: "space-between",
          },
        },
      },
    },

    APP_MOBILE_MENU: {
      type: { smallScreen: "DRAWER" },
      drawer: {
        content,
        header,
        source: "navbar",
        onClose: closeDrawer,
        style: {
          overlay: {
            base: { padding: theme.boxSpacing(6), display: "none" },
            smScreen: {
              padding: 0,
              display: "flex",
            },
          },
          itemWrapper: {
            base: { height: "100%", borderRadius: 0 },
          },
          header: {
            justifyContent: "space-between",
            padding: theme.boxSpacing(5, 8),
          },
        },
      },
    },
  };
};
