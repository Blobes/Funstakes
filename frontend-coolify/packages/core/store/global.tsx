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

/**
 * Defines the shape and actions of the global application store.
 */
interface GlobalState {
  // --- Auth State & Setters ---
  authStatus: AuthStatus;
  setAuthStatus: (status: AuthStatus) => void;
  authUser: IUser | null;
  setAuthUser: (user: IUser | null) => void;
  accessToken: string | null;
  setAccessToken: (token?: string | null) => void;
  clearAuthUser: () => void;

  // --- Language State & Setters ---
  i18nInstance: I18nInstance | null;
  setI18nInstance: (instance: I18nInstance) => void;
  currentLanguage: SupportedIsoCode;
  setCurrentLanguage: (lang: SupportedIsoCode) => void;

  // --- User Account State & Setters ---
  accountStatus: AccountStatus;
  setAccountStatus: (status: AccountStatus) => void;

  // --- UI State & Setters ---
  snackBarMsgs: ISnackBarMsgs;
  setSnackBarMsg: (msg: IMessage, override?: boolean) => void;
  removeSnackBarMsg: (id?: string, clearAll?: boolean) => void;
  inlineMsg: React.ReactNode | null;
  setInlineMsg: (inlineMsg: React.ReactNode | null) => void;
  lastPage: IPage;
  setPage: (page: IPage) => void;
  drawerContent: DrawerProps | null;
  setDrawerContent: (content: DrawerProps | null) => void;
  modalContent: ModalProps | null;
  setModalContent: (content: ModalProps | null) => void;
  defaultHeader: boolean;
  setDefaultHeader: (show: boolean) => void;
  isSpaLoading: boolean;
  setIsSpaLoading: (loading: boolean) => void;
  isCrossZoneLoading: boolean;
  setIsCrossZoneLoading: (value: boolean) => void;

  // --- System/Network State & Setters ---
  networkStatus: NetworkStatus;
  setNetworkStatus: (status: NetworkStatus) => void;
  checkingSignal: boolean;
  setSignalCheck: (checking: boolean) => void;
  offlineMode: boolean;
  setOfflineMode: (mode: boolean) => void;
  transitData: any | null;
  setTransitData: <T>(data: T | null) => void;

  // --- Time State & Setters ---
  now: number;
  updateNow: () => void;

  // --- Virtual Keyboard State & Setters ---
  activeInputRef: React.RefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  > | null;
  activeOnChange: ((event: any) => void) | null;
  activeFieldType: InputFieldType | null;
  setActiveInput: (
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null> | null,
    onChange: ((event: any) => void) | null,
    fieldType?: InputFieldType | null,
  ) => void;
  isKeyboardVisible: boolean;
  setKeyboardVisible: (visible: boolean) => void;
}

/**
 * Hook for accessing the global store.
 * Using a single store for global UI states.
 */
export const useGlobalStore = create<GlobalState>((set) => ({
  // --- Auth State & Setters ---
  authStatus: "LOADING",
  setAuthStatus: (authStatus) => set({ authStatus }),

  authUser: null,
  setAuthUser: (authUser) => set({ authUser }),

  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),

  clearAuthUser: () =>
    set({ authUser: null, accessToken: null, authStatus: "UNAUTHENTICATED" }),

  // --- Language State & Setters ---
  i18nInstance: null,
  setI18nInstance: (instance) => set({ i18nInstance: instance }),

  currentLanguage: "en",
  setCurrentLanguage: (lang) => set({ currentLanguage: lang }),

  // --- User Account State & Setters ---
  accountStatus: "PENDING",
  setAccountStatus: (accountStatus) => set({ accountStatus }),

  // --- UI State & Setters ---
  snackBarMsgs: {
    messages: [],
    defaultDur: SNACKBAR_DURATION.SECS_6,
    dir: "up",
  },
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

  inlineMsg: null,
  setInlineMsg: (inlineMsg) => set({ inlineMsg }),

  lastPage: CLIENT_ROUTES.home,
  setPage: (lastPage) => set({ lastPage }),

  drawerContent: null,
  setDrawerContent: (update) =>
    set((state) => {
      if (!state.drawerContent && !update) return state;
      if (state.drawerContent === update) return state;
      return { drawerContent: update };
    }),

  modalContent: null,
  setModalContent: (update) =>
    set((state) => {
      if (!state.modalContent && !update) return state;
      if (state.modalContent === update) return state;
      return { modalContent: update };
    }),

  defaultHeader: true,
  setDefaultHeader: (defaultHeader) => set({ defaultHeader }),

  isSpaLoading: false,
  setIsSpaLoading: (isSpaLoading) => set({ isSpaLoading }),

  isCrossZoneLoading: false,
  setIsCrossZoneLoading: (isCrossZoneLoading) => set({ isCrossZoneLoading }),

  // --- System/Network State & Setters ---
  networkStatus: "UNKNOWN",
  setNetworkStatus: (networkStatus) => set({ networkStatus }),

  checkingSignal: false,
  setSignalCheck: (checkingSignal) => set({ checkingSignal }),

  offlineMode: false,
  setOfflineMode: (offlineMode) => set({ offlineMode }),

  transitData: null,
  setTransitData: (data) => set({ transitData: data }),

  // --- Time State & Setters ---
  now: Date.now(),
  updateNow: () => set({ now: Date.now() }),

  // --- Virtual Keyboard State & Setters ---
  activeInputRef: null,
  activeOnChange: null,
  activeFieldType: null,
  setActiveInput: (ref, onChange, fieldType) =>
    set({
      activeInputRef: ref,
      activeOnChange: onChange,
      activeFieldType: fieldType,
    }),

  isKeyboardVisible: false,
  setKeyboardVisible: (visible) => set({ isKeyboardVisible: visible }),
}));
