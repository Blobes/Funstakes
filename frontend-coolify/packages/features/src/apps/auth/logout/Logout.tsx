"use client";

import React from "react";
import { ConfirmAction, AppButton, TransText } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { useMisc, useStaticTranslation } from "@repo/shared-hooks";
import { LogOut, LogOutIcon } from "lucide-react";
import { useLogout } from "./useLogout";
import { BaseStyleProps, AUTH_BUTTON_LABELS, AUTH_FEEDBACK } from "@repo/core";
import { usePopup } from "../../../popups/usePopup";

export const ComfirmLogout = () => {
  const { closeModal } = useMisc();
  const { handleLogout, isLoggingOut } = useLogout();
  const { translateTxtString } = useStaticTranslation();

  return (
    <ConfirmAction
      icon={<LogOutIcon size={32} />}
      headline={translateTxtString(AUTH_FEEDBACK.logout_confirmation)}
      cancelLabel={translateTxtString(AUTH_BUTTON_LABELS.not_yet)}
      confirmLabel={translateTxtString(AUTH_BUTTON_LABELS.sure_i_do)}
      onConfirm={handleLogout}
      onCancel={closeModal}
      isLoading={isLoggingOut}
    />
  );
};

export const Logout = ({ style }: { style?: BaseStyleProps }) => {
  const theme = useTheme();
  const { openPopup } = usePopup();

  return (
    <AppButton
      variant="text"
      onClick={() => openPopup({ name: "CONFIRM_LOGOUT" })}
      style={{
        width: "100%",
        gap: theme.gap(10),
        padding: theme.boxSpacing(0),
        "& svg": {
          width: style?.icon?.size || 22,
          height: style?.icon?.size || 22,
          transform: "scale(-1)",
          ...style?.icon,
        },
        "&:hover": {
          background: "transparent",
          ...style?.itemWrapper?.hover,
        },
        ...style?.itemWrapper,
      }}
    >
      <LogOut />
      <TransText
        {...AUTH_BUTTON_LABELS.logout}
        sx={{
          ...theme.typography.text2,
          fontWeight: "600",
          color: theme.palette.gray[300],
          textAlign: "left",
          "&:hover": {
            color: theme.palette.primary.dark,
          },
          ...style?.label,
        }}
      />
    </AppButton>
  );
};
