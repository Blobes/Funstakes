"use client";

import React from "react";
import {
  BadgeQuestionMark,
  AudioLines,
  Bell,
  Bookmark,
  CircleDashed,
  Gem,
  House,
  Mail,
  Pentagon,
  Search,
  Settings,
  User,
  WalletMinimal,
  Info,
  Newspaper,
} from "lucide-react";
import { CLIENT_ROUTES } from "./routesConfig";
import { COUNTRIES } from "./countries";
import {
  ICountryItem,
  IMenuItem,
  ITranslation,
  ListType,
} from "../types/ui-props";
import { COMMON_LIST } from "./msgRegistry";
import { useTheme } from "@mui/material/styles";

type PageKey = keyof typeof COMMON_LIST.pages | "stakes" | "vibes" | "voices";

/**
 * Navigation item list for navigating through the app.
 */
export const NAV_LISTS = (translator?: (transData: ITranslation) => string) => {
  const translate = (transData: ITranslation) => {
    return translator ? translator(transData) : transData.tValue;
  };

  const ITEMS: Partial<Record<PageKey, IMenuItem>> = {
    profile: {
      title: translate(COMMON_LIST.pages.profile),
      prefix: <User />,
      url: CLIENT_ROUTES.profile.path,
    },
    pricing: {
      title: translate(COMMON_LIST.pages.pricing),
      prefix: <Gem />,
      url: CLIENT_ROUTES.pricing.path,
    },
    wallet: {
      title: translate(COMMON_LIST.pages.wallet),
      prefix: <WalletMinimal />,
      url: CLIENT_ROUTES.wallet.path,
    },
    bookmarks: {
      title: translate(COMMON_LIST.pages.bookmarks),
      prefix: <Bookmark />,
      url: CLIENT_ROUTES.bookmarks.path,
    },
    settings: {
      title: translate(COMMON_LIST.pages.settings),
      prefix: <Settings />,
      url: CLIENT_ROUTES.settings.path,
    },
    home: {
      title: translate(COMMON_LIST.pages.home),
      prefix: <House />,
      url: CLIENT_ROUTES.home.path,
    },
    stakes: {
      title: CLIENT_ROUTES.stakes.title,
      prefix: <Pentagon />,
      url: CLIENT_ROUTES.stakes.path,
    },
    explore: {
      title: translate(COMMON_LIST.pages.explore),
      prefix: <Search />,
      url: CLIENT_ROUTES.explore.path,
    },
    vibes: {
      title: CLIENT_ROUTES.vibes.title,
      prefix: <CircleDashed />,
      url: CLIENT_ROUTES.vibes.path,
    },
    voices: {
      title: CLIENT_ROUTES.voices.title,
      prefix: <AudioLines />,
      url: CLIENT_ROUTES.voices.path,
    },
    notifications: {
      title: translate(COMMON_LIST.pages.notifications),
      prefix: <Bell />,
      url: CLIENT_ROUTES.notifications.path,
    },
    inbox: {
      title: translate(COMMON_LIST.pages.inbox),
      prefix: <Mail />,
      url: CLIENT_ROUTES.inbox.path,
    },
    about: {
      title: translate(COMMON_LIST.pages.about),
      prefix: <Info />,
      url: CLIENT_ROUTES.about.path,
    },
    support: {
      title: translate(COMMON_LIST.pages.support),
      prefix: <BadgeQuestionMark />,
      url: CLIENT_ROUTES.support.path,
    },
    blogs: {
      title: translate(COMMON_LIST.pages.blogs),
      url: CLIENT_ROUTES.blogs.path,
    },
    privacy: {
      title: translate(COMMON_LIST.pages.privacy),
      url: CLIENT_ROUTES.privacy.path,
    },
    terms: {
      title: translate(COMMON_LIST.pages.terms),
      url: CLIENT_ROUTES.terms.path,
    },
    news: {
      title: translate(COMMON_LIST.pages.news),
      prefix: <Newspaper />,
      url: CLIENT_ROUTES.news.path,
    },
  };

  // Profile menu items for authenticated user top panel
  const USER_TOP_NAV_LIST = [
    ITEMS.profile,
    ITEMS.pricing,
    ITEMS.wallet,
    ITEMS.bookmarks,
    ITEMS.settings,
  ] as IMenuItem[];

  // Sidebar menu items for authenticated user desktop view
  const USER_LEFT_NAV_LIST = [
    ITEMS.home,
    ITEMS.stakes,
    ITEMS.explore,
    ITEMS.vibes,
    ITEMS.voices,
    ITEMS.notifications,
    ITEMS.inbox,
  ] as IMenuItem[];

  // Navigation bar items for authenticated user mobile view
  const USER_BOTTOM_NAV_LIST = [
    ITEMS.home,
    ITEMS.stakes,
    ITEMS.explore,
    ITEMS.vibes,
    ITEMS.inbox,
  ] as IMenuItem[];

  // Top header menu items for guest view
  const HEADER_NAV_LIST = [
    ITEMS.about,
    ITEMS.pricing,
    ITEMS.support,
    ITEMS.news,
  ] as IMenuItem[];

  // Footer navigation links for general page layout
  const FOOTER_NAV_LIST = [
    ITEMS.about,
    ITEMS.support,
    ITEMS.pricing,
    ITEMS.blogs,
    ITEMS.privacy,
    ITEMS.terms,
    ITEMS.news,
  ] as IMenuItem[];

  return {
    USER_TOP_NAV_LIST,
    USER_LEFT_NAV_LIST,
    USER_BOTTOM_NAV_LIST,
    HEADER_NAV_LIST,
    FOOTER_NAV_LIST,
  };
};

export const MESSAGE_LIST = (
  translator?: (transData: ITranslation) => string,
) => {
  const translate = (transData: ITranslation) => {
    return translator ? translator(transData) : transData.tValue;
  };
  return {
    [ListType.COUNTRY]: {
      empty: translate(COMMON_LIST.msg.country_empty),
      noMatch: translate(COMMON_LIST.msg.country_no_match),
    },
    [ListType.NAVIGATION]: {
      empty: translate(COMMON_LIST.msg.navigation_empty),
      noMatch: translate(COMMON_LIST.msg.navigation_no_match),
    },
    [ListType.TOPICS]: {
      empty: translate(COMMON_LIST.msg.topics_empty),
      noMatch: translate(COMMON_LIST.msg.topics_no_match),
    },
    [ListType.DEFAULT]: {
      empty: translate(COMMON_LIST.msg.default_empty),
      noMatch: translate(COMMON_LIST.msg.default_no_match),
    },
  };
};

export const COUNTRY_LIST = () => {
  const theme = useTheme();
  const LIST: ICountryItem[] = Object.values(COUNTRIES).map((country) => ({
    ...country,
    id: `${country.iso}${country.code}`,
    title: `${country.iso} (${country.code})`,
    code: country.code,
    type: "BUTTON" as const,
    element: <span style={{ ...theme.typography.text2 }}>{country.flag}</span>,
  }));
  return LIST;
};

export const CREATE_POST_LIST = () => {
  const LIST: IMenuItem[] = [
    {
      title: "Gist",
      prefix: <BadgeQuestionMark />,
    },
    {
      title: "Stake",
      prefix: <Gem />,
    },
    {
      title: "Vibez",
      prefix: <Gem />,
    },
  ];
  return LIST;
};
