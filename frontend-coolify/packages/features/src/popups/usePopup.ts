"use client";

import { useMisc } from "@repo/shared-hooks";
import { POPUP_CONFIG, PopupName } from "./config";
import { useCallback } from "react";
import { useTheme } from "@mui/material/styles";

interface UsePopupOptions {
  name: PopupName;
  content?: React.ReactNode;
  header?: React.ReactNode;
}

/**
 * Handles presentation logic layer routing parameters across modalities like dialog modals or drawers.
 */
export const usePopup = () => {
  const { openModal, openDrawer, closeModal, closeDrawer } = useMisc();
  const theme = useTheme();

  /**
   * Dispatches window visibility changes matching target configurations.
   */
  const openPopup = useCallback(
    (options: UsePopupOptions) => {
      const { name, content, header } = options;

      const activeConfig = POPUP_CONFIG({
        content,
        header,
        closeModal,
        closeDrawer,
        theme,
      });

      const config = activeConfig[name];
      if (!config) return;

      const isModalTarget =
        config.type.baseScreen === "MODAL" ||
        config.type.smallScreen === "MODAL";
      const isDrawerTarget =
        config.type.baseScreen === "DRAWER" ||
        config.type.smallScreen === "DRAWER";

      if (isModalTarget && config.modal) openModal(config.modal);
      if (isDrawerTarget && config.drawer) openDrawer(config.drawer);
    },
    [openModal, openDrawer, closeModal, closeDrawer, theme],
  );

  return { openPopup };
};
