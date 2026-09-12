"use client";

import React from "react";
import { DrawerProps, ModalProps } from "@repo/core";
import { ComfirmLogout } from "../apps/auth/logout/Logout";
import { Theme } from "@mui/material/styles";
import { DisplayFeedbackUI } from "@repo/shared-ui";
import { ConfirmSessionTermination } from "../apps/auth/verify-identity/Session";

export type PopupName =
  | "CONFIRM_LOGOUT"
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
          base: {
            overlay: { padding: theme.boxSpacing(6), display: "none" },
            content: { height: "100%", borderRadius: "0px" },
          },
          smallScreen: {
            overlay: { padding: theme.boxSpacing(0), display: "flex" },
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
        onClose: closeDrawer,
        style: {
          base: { overlay: { padding: theme.boxSpacing(6) } },
          smallScreen: {
            overlay: { padding: theme.boxSpacing(0) },
            content: { height: "100%", width: "80%", borderRadius: "0px" },
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
          base: {
            overlay: { padding: theme.boxSpacing(6), display: "none" },
            content: { height: "100%", borderRadius: "0px" },
          },
          smallScreen: {
            overlay: { padding: theme.boxSpacing(0), display: "flex" },
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
