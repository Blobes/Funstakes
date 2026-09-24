"use client";

import { usePopup } from "../../../popups/usePopup";
import React, { useCallback } from "react";

export const useCreatePost = () => {
  const { openPopup } = usePopup();

  const openCreatePost = useCallback(
    (element: React.ReactNode) => {
      openPopup({ name: "CREATE_POST", content: element });
    },
    [openPopup],
  );

  return { openCreatePost };
};
