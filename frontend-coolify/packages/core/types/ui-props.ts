"use client";

import React, { CSSProperties } from "react";
import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material/styles";
import {
  FetchStatus,
  ISinglePayload,
  ITopicPayload,
} from "./payloads/modified";
import { IMedia } from "./media";
import { AuthStepName, OtpStepName, PasswordResetStepName } from "./auth";

// ==========================================
// COMMON ENUMS & CORE PRIMITIVES
// ==========================================
export enum ListType {
  COUNTRY = "COUNTRY",
  TOPICS = "TOPICS",
  NAVIGATION = "NAVIGATION",
  DEFAULT = "ITEM",
}

export enum KeyType {
  POST = "POST",
  USER = "USER",
}

export type Direction = "left" | "right" | "up" | "down";
export type TransitionType = "fade" | "grow" | "slide" | "zoom" | "collapse";
export type NetworkStatus = "STABLE" | "UNSTABLE" | "OFFLINE" | "UNKNOWN";
export type UIMode = "ONLINE" | "OFFLINE";
export type DateType = "SHORTENED" | "COMPLETE" | "DATE-ONLY";

export interface ElementPosition {
  x: number;
  y: number;
}

export interface IPage {
  title: string | (() => string);
  path: string;
}

export interface ILocation {
  name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  type: "Point";
  coordinates: [number, number];
}

export interface TrackedFile extends File {
  trackingId: string;
}

// ==========================================
// STYLING & THEMING
// ==========================================

export type GenericStyle = SystemStyleObject<Theme> & {
  [key: string]: SystemStyleObject<Theme> | CSSProperties | any;
};

// ==========================================
// INTERNATIONALIZATION & TRANSLATION
// ==========================================

export interface ITranslation {
  readonly tKey?: string;
  readonly tValue?: string;
  readonly interpolations?: Record<string, any>;
  inlineComponents?: React.ReactElement[] | Record<string, React.ReactElement>;
}

export interface TransData {
  headline?: ITranslation;
  textDesc?: ITranslation;
  primaryBtn?: ITranslation;
  secondaryBtn?: ITranslation;
}

export interface DynamicTranslateReq {
  textId: string;
  textToTranslate: string;
  sourceLang: string;
  targetLang: string;
}

export interface DynamicTranslateRes {
  translatedText: string;
}

export interface DynamicTranslateFns {
  translateServiceFn: (
    data: DynamicTranslateReq,
  ) => Promise<ISinglePayload<DynamicTranslateRes | null>>;
  resolveTranslation?: (
    response: ISinglePayload<DynamicTranslateRes | null>,
  ) => string | undefined;
}

export interface DynamicTranslateArgs {
  textData: DynamicTranslateReq;
  parentKey: string;
  transCb: DynamicTranslateFns;
}

// ==========================================
// NAVIGATION & MENU TYPES
// ==========================================

export interface IMenuItem {
  id?: string;
  title?: string;
  type?: "LINK" | "BUTTON" | "COMPONENT";
  element?: React.ReactNode;
  url?: string;
  action?: () => void;
}

export type ITopic = IMenuItem & ITopicPayload;

export interface INavBar {
  setLastPage: (page: IPage) => void;
  list: IMenuItem[];
}

export interface MenuRef {
  openMenu: (anchor: HTMLElement) => void;
  closeMenu: () => void;
}

export interface NavigateOptions {
  type?: "push" | "replace";
  savePage?: boolean;
  loadPage?: boolean;
  event?: React.MouseEvent;
}

// ==========================================
// STEPPER, FLOWS & STEPS
// ==========================================

export type PostStepName =
  | "CONTENT"
  | "SETTINGS"
  | "MEDIA_PREVIEW"
  | "MEDIA_CUSTOMIZATION";

export type StepName =
  | "FEED"
  | AuthStepName
  | PostStepName
  | PasswordResetStepName
  | OtpStepName;

export interface IStep<T> {
  name: T;
  label?: string;
  element: React.ReactNode;
  action?: () => void;
  allowPrevious?: boolean;
  revisitable?: boolean;
}

export interface NavigationProps {
  onNext?: () => void;
  onPrev?: () => void;
  jumpTo?: () => void;
}

export interface StepperStyle {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
}

export interface StepperProps<T> extends NavigationProps {
  modalRef?: React.RefObject<OverlayRef>;
  redirectTo?: string;
  style?: StepperStyle;
  setStep?: (step: T) => void;
  step?: T;
}

// ==========================================
// OVERLAYS, MODALS & DRAWERS
// ==========================================

export interface OverlayRef {
  openOverlay: () => void;
  closeOverlay: () => void;
}

export interface OverlayStyleProps {
  base?: {
    overlay?: GenericStyle;
    content?: GenericStyle;
  };
  smallScreen?: {
    overlay?: GenericStyle;
    content?: GenericStyle;
  };
  mediumScreen?: {
    overlay?: GenericStyle;
    content?: GenericStyle;
  };
  header?: GenericStyle;
}

export interface BaseOverlayProps {
  content: React.ReactNode;
  showHeader?: boolean;
  header?: React.ReactNode;
  onClose?: () => void;
  style?: OverlayStyleProps;
}

export interface ModalProps extends BaseOverlayProps {
  canBeClosed?: boolean;
  transition?: {
    type: TransitionType;
    direction?: Direction;
  };
}

export interface DrawerProps extends BaseOverlayProps {
  clickToClose?: boolean;
  transDirection?: {
    base?: Direction;
    mobile?: Direction;
  };
  dragConfig?: IDragConfig;
  blurOverlayBG?: boolean;
  source?: string;
}

// ==========================================
// DRAG & GESTURES
// ==========================================

export interface IDragConfig {
  axis?: "X" | "Y";
  dragOrigin?: "LTR" | "RTL";
  threshold?: number;
  closeAtMiddle?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onPositionChange?: (position: ElementPosition) => void;
}

export interface IDragResult {
  axis: "X" | "Y";
  dragOffset: number;
  resolveDragConfig: (dir?: Direction) => IDragConfig;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (onDragEnd?: () => void) => void;
    onElementDragStart: (
      e: React.MouseEvent<HTMLDivElement>,
      itemId: string,
      onFocus?: (id: string) => void,
    ) => void;
  };
}

// ==========================================
// INPUTS & FORM VALIDATION
// ==========================================

export type InputType =
  | "EMAIL"
  | "PHONE"
  | "PASSWORD"
  | "USERNAME"
  | "NUMBER"
  | "UNKNOWN"
  | "NAME";

export type InputStatus = "VALID" | "INVALID";

export type InputFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "phone-formatted"
  | "password";

export interface InputValidation {
  id?: string;
  status: InputStatus;
  message?: string;
  type?: InputType;
}

// ==========================================
// MESSAGING, FEEDBACK & SNACKBARS
// ==========================================

export type DisplayFeedbackUIType =
  | "ALREADY_LOGGED_IN"
  | "UNAUTHORIZED"
  | "NETWORK_GLITCH"
  | "MAINTENANCE"
  | "BANNED"
  | "NEEDS_LOGIN"
  | "NEEDS_ONBOARDING"
  | "NEEDS_OTP_VERIFICATION"
  | "NEEDS_RESTORE"
  | "PASSWORD_RESET_SUCCESS"
  | "UNKNOWN"
  | "SERVER_ERROR";

export interface FeedbackCTA {
  type?: "BUTTON" | "ICON";
  variant?: "contained" | "outlined";
  label?: React.ReactNode;
  toolTip?: string;
  action?: () => void | Promise<void>;
  href?: string;
}

export interface FeedbackStyle {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
  icon?: GenericStyle;
  primaryCta?: GenericStyle;
  secondaryCta?: GenericStyle;
}

export interface FeedbackProps {
  headline?: React.ReactNode;
  tagline?: React.ReactNode;
  icon?: React.ReactNode;
  style?: FeedbackStyle;
  primaryCta?: FeedbackCTA;
  secondaryCta?: FeedbackCTA;
}

export interface IInlineMsg {
  msg: React.ReactNode | null;
}

export interface IMessage {
  id?: string;
  headline?: string;
  tagline?: string;
  customContent?: React.ReactNode;
  msgStatus?: FetchStatus;
  behavior?: "FIXED" | "TIMED";
  duration?: number;
  hasClose?: boolean;
  cta?: {
    label: string;
    action: () => void;
  };
  icon?: React.ReactNode;
}

export interface ISnackBarMsgs {
  messages?: IMessage[];
  defaultDur: number;
  dir?: Direction;
}

export interface IListItem {
  item: React.ReactNode;
  action?: () => void | null;
}

// ==========================================
// GUIDES, TOURS & PRESENTATION
// ==========================================

export interface GuideDetail {
  id?: string;
  detail: React.ReactNode;
}

export interface Guide {
  id?: string;
  title?: string;
  guideDetails: GuideDetail[];
  icon?: React.ReactElement;
  displayAsList?: boolean;
}

type TourStepName = "BEGIN" | "POST";

export interface TourGuide extends Omit<IStep<TourStepName>, "element"> {
  media?: IMedia;
  xPosition: number;
  yPosition: number;
  desc?: React.ReactNode;
}

export interface IBGFadeSlideData {
  name?: string;
  headline: string;
  tagline: string;
  media: IMedia;
}

export interface ICountryItem extends IMenuItem {
  name?: string;
  code?: string;
  iso?: string;
  flag?: string;
  titleFlag?: string;
  titleCode?: string;
  isoCode?: string;
  codeFlag?: string;
  fullInfo?: string;
}

// ==========================================
// UTILITY & DATA STORAGE PIPELINES
// ==========================================

export interface QueueItem<T = unknown> {
  newValue: T;
  prevValue?: T;
  timestamp?: number;
  retryCount?: number;
}

export type GenericQueue = Record<string, QueueItem>;

export interface IIdbData<T> {
  data: T;
  savedAt: Date | null;
  lastViewed?: Date | null;
}
