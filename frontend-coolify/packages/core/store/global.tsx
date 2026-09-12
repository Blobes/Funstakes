"use client";

import { create } from "zustand";
import { i18n as I18nInstance } from "i18next";
import { IUser } from "../types/payloads/modified";
import { SupportedIsoCode } from "../constants/languages";
import { AccountStatus } from "../types/payloads/user";
import {
  DrawerProps,
  IMessage,
  InputFieldType,
  IPage,
  ISnackBarMsgs,
  ModalProps,
  NetworkStatus,
} from "../types/ui-props";
import { CLIENT_ROUTES } from "../constants/routesConfig";
import { AuthStatus } from "../types/auth";
import { SNACKBAR_DURATION } from "../constants/others";

/** * Defines the shape and actions of the global application store.
 */
interface GlobalState {
  // Auth State
  authStatus: AuthStatus;
  authUser: IUser | null;
  isAuthLoading: boolean;
  accessToken: string | null; // Keep short-lived token in volatile memory only

  // Language
  i18nInstance: I18nInstance | null;
  setI18nInstance: (instance: I18nInstance) => void;
  currentLanguage: SupportedIsoCode;
  setCurrentLanguage: (lang: SupportedIsoCode) => void;

  // User Account State
  accountStatus: AccountStatus;

  // UI State
  snackBarMsgs: ISnackBarMsgs;
  inlineMsg: React.ReactNode | null;
  isGlobalLoading: boolean;
  lastPage: IPage;
  drawerContent: DrawerProps | null;
  modalContent: ModalProps | null;
  defaultHeader: boolean;

  // System/Network State
  networkStatus: NetworkStatus;
  checkingSignal: boolean;
  offlineMode: boolean;
  transitData: any | null;

  // Time
  now: number;

  // Virtual Keyboard
  activeInputRef: React.RefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  > | null;
  activeOnChange: ((event: any) => void) | null;
  activeFieldType: InputFieldType | null;
  isKeyboardVisible: boolean;
  setActiveInput: (
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null> | null,
    onChange: ((event: any) => void) | null,
    fieldType?: InputFieldType | null,
  ) => void;
  setKeyboardVisible: (visible: boolean) => void;

  // Actions
  setAuthStatus: (status: AuthStatus) => void;
  setAuthUser: (user: IUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAccountStatus: (status: AccountStatus) => void;
  logout: () => void;
  setSnackBarMsg: (msg: IMessage, override: boolean) => void;
  removeSnackBarMsg: (id?: string, clearAll?: boolean) => void;
  setInlineMsg: (inlineMsg: React.ReactNode | null) => void;
  setGlobalLoading: (loading: boolean) => void;
  setPage: (page: IPage) => void;
  setDrawerContent: (content: DrawerProps | null) => void;
  setModalContent: (content: ModalProps | null) => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setSignalCheck: (checking: boolean) => void;
  setOfflineMode: (mode: boolean) => void;
  setDefaultHeader: (show: boolean) => void;
  updateNow: () => void;
  setTransitData: <T>(data: T | null) => void;
}

/** * Hook for accessing the global store.
 * Using a single store for global UI states.
 */
export const useGlobalStore = create<GlobalState>((set) => ({
  // Initial States
  authStatus: "LOADING",
  authUser: null,
  isAuthLoading: false,
  accountStatus: "PENDING",
  accessToken: null,
  snackBarMsgs: {
    messages: [],
    defaultDur: SNACKBAR_DURATION.SECS_6,
    dir: "up",
  },
  inlineMsg: null,
  isGlobalLoading: false,
  lastPage: CLIENT_ROUTES.home,
  drawerContent: null,
  modalContent: null,
  networkStatus: "UNKNOWN",
  checkingSignal: false,
  offlineMode: false,
  defaultHeader: true,
  now: Date.now(),
  transitData: null,

  // Action Implementations
  setAuthStatus: (authStatus) => set({ authStatus }),
  setAuthUser: (authUser) => set({ authUser }),
  setAccountStatus: (accountStatus) => set({ accountStatus }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logout: () =>
    set({ authUser: null, accessToken: null, authStatus: "UNAUTHENTICATED" }),

  // Language
  i18nInstance: null,
  setI18nInstance: (instance) => set({ i18nInstance: instance }),
  currentLanguage: "en",
  setCurrentLanguage: (lang) => set({ currentLanguage: lang }),

  setSnackBarMsg: (newMsg, override = false) =>
    set((state) => ({
      snackBarMsgs: {
        ...state.snackBarMsgs,
        messages: override
          ? [newMsg]
          : [...(state.snackBarMsgs.messages || []), newMsg],
      },
    })),
  removeSnackBarMsg: (id?: string, clearAll: boolean = false) =>
    set((state) => ({
      snackBarMsgs: {
        ...state.snackBarMsgs,
        messages: clearAll
          ? []
          : state.snackBarMsgs.messages?.filter((m) => m.id !== id),
      },
    })),

  setInlineMsg: (inlineMsg) => set({ inlineMsg }),
  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),
  setPage: (lastPage) => set({ lastPage }),

  setDrawerContent: (update) =>
    set((state) => {
      if (!state.drawerContent && !update) return state;
      if (state.drawerContent === update) return state;
      return { drawerContent: update };
    }),

  setModalContent: (update) =>
    set((state) => {
      if (!state.modalContent && !update) return state;
      if (state.modalContent === update) return state;
      return { modalContent: update };
    }),
  setNetworkStatus: (networkStatus) => set({ networkStatus }),
  setSignalCheck: (checkingSignal) => set({ checkingSignal }),
  setOfflineMode: (offlineMode) => set({ offlineMode }),
  setDefaultHeader: (defaultHeader) => set({ defaultHeader }),
  updateNow: () => set({ now: Date.now() }),

  setTransitData: (data) => set({ transitData: data }),

  // Virtual Keyboard
  activeInputRef: null,
  activeOnChange: null,
  activeFieldType: null,
  isKeyboardVisible: false,
  setActiveInput: (ref, onChange, fieldType) =>
    set({
      activeInputRef: ref,
      activeOnChange: onChange,
      activeFieldType: fieldType,
    }),
  setKeyboardVisible: (visible) => set({ isKeyboardVisible: visible }),
}));
