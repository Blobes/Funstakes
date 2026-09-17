"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  CLIENT_ROUTES,
  SERVER_API,
  STORAGE_KEYS,
  useGlobalStore,
} from "@repo/core";
import { apiClient, purgeCache } from "@repo/helpers";
import { useMisc, usePage, useSnackbar } from "@repo/shared-hooks";

/** * Handles the user logout flow, clearing state, cache, and redirecting. */
export const useLogout = () => {
  const clearAuthUser = useGlobalStore((state) => state.clearAuthUser);

  const { navigateTo } = usePage();
  const { setSBMessage, removeSBMessages } = useSnackbar();
  const { closeModal } = useMisc();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  /** * Mutation to handle the server-side logout process. */
  const { mutate: logoutMutation, isPending } = useMutation({
    mutationFn: async () => {
      return await apiClient(SERVER_API.logout, { method: "POST" });
    },
    onSuccess: () => {
      purgeCache({
        queryClient,
        queryKeys: STORAGE_KEYS.AUTH_TRANSIT,
      });
      queryClient.clear();

      clearAuthUser();
      closeModal();

      // Handle navigation logic
      if (pathname !== CLIENT_ROUTES.home.path) {
        navigateTo(CLIENT_ROUTES.home, {
          loadPage: true,
        });
      } else {
        router.refresh();
      }
    },
    onError: (error: ApiError) => {
      setSBMessage({
        msg: { tagline: error.localizedErrMsg, msgStatus: "ERROR" },
      });
      console.error("Logout failed:", error);
    },
    onSettled: () => removeSBMessages(),
  });

  /** * Memoized logout handler to be used in UI components. */
  const handleLogout = useCallback(() => {
    logoutMutation();
  }, [logoutMutation]);

  return {
    handleLogout,
    isLoggingOut: isPending,
  };
};
