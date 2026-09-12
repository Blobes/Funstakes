"use client";

import { IPage } from "../types/ui-props";
import { COMMON_BUTTON_LABELS, COMMON_LIST } from "./msgRegistry";

export const CLIENT_ROUTES = {
  // Web
  about: { title: COMMON_LIST.nav.about.tValue, path: "/about" },
  pricing: { title: COMMON_LIST.nav.pricing.tValue, path: "/pricing" },
  blogs: { title: COMMON_LIST.nav.blogs.tValue, path: "/blogs" },
  support: { title: COMMON_LIST.nav.support.tValue, path: "/support" },
  privacy: { title: COMMON_LIST.nav.privacy.tValue, path: "/privacy" },
  terms: { title: COMMON_LIST.nav.terms.tValue, path: "/terms" },
  news: { title: COMMON_LIST.nav.news.tValue, path: "/news" },

  // Auth
  login: { title: COMMON_LIST.nav.login.tValue, path: "/login" },
  signup: { title: COMMON_LIST.nav.signup.tValue, path: "/signup" },
  restoreAccount: {
    title: COMMON_LIST.nav.restoreAccount.tValue,
    path: "/restore-account",
  },
  verifyIdentity: {
    title: COMMON_LIST.nav.verifyIdentity.tValue,
    path: "/verify-identity",
  },
  onboarding: {
    title: COMMON_LIST.nav.onboarding.tValue,
    path: "/onboarding",
  },
  resetPassword: {
    title: COMMON_BUTTON_LABELS.reset_password.tValue,
    path: "/reset-password",
  },

  // Shell
  home: { title: COMMON_LIST.nav.home.tValue, path: "/" },
  explore: { title: COMMON_LIST.nav.explore.tValue, path: "/explore" },

  // Messaging
  inbox: { title: COMMON_LIST.nav.inbox.tValue, path: "/inbox" },

  // Wallet
  wallet: { title: COMMON_LIST.nav.wallet.tValue, path: "/wallet" },

  // Profile
  profile: { title: COMMON_LIST.nav.profile.tValue, path: "/profile" },
  bookmarks: {
    title: COMMON_LIST.nav.bookmarks.tValue,
    path: "/bookmarks",
  },
  notifications: {
    title: COMMON_LIST.nav.notifications.tValue,
    path: "/notifications",
  },
  settings: {
    title: COMMON_LIST.nav.settings.tValue,
    path: "/settings",
  },

  // Post
  gist: { title: "Gist", path: "/gist" },
  gists: { title: "Gists", path: "/gists" },
  stake: { title: "Stake", path: "/stake" },
  stakes: { title: "Stakes", path: "/stakes" },
  vibes: { title: "Vibes", path: "/vibes" },
  voices: { title: "Voices", path: "/voices" },

  // Offline
  offline: { title: COMMON_LIST.nav.offline.tValue, path: "/offline" },
} satisfies Record<string, IPage>;

/**  Registry mapping logical application zones to their respective route paths. */
const OFFLINE_ROUTES = [CLIENT_ROUTES.offline.path];
const WEB_ROUTES = [
  CLIENT_ROUTES.about.path,
  CLIENT_ROUTES.pricing.path,
  CLIENT_ROUTES.blogs.path,
  CLIENT_ROUTES.support.path,
  CLIENT_ROUTES.privacy.path,
  CLIENT_ROUTES.terms.path,
  CLIENT_ROUTES.news.path,
];
const AUTH_ROUTES = [
  CLIENT_ROUTES.login.path,
  CLIENT_ROUTES.signup.path,
  CLIENT_ROUTES.restoreAccount.path,
  CLIENT_ROUTES.verifyIdentity.path,
  CLIENT_ROUTES.resetPassword.path,
  CLIENT_ROUTES.onboarding.path,
];
const POST_ROUTES = [
  CLIENT_ROUTES.gist.path,
  CLIENT_ROUTES.gists.path,
  CLIENT_ROUTES.stake.path,
  CLIENT_ROUTES.stakes.path,
];
const UNPROTECTED_ROUTES = [
  CLIENT_ROUTES.login.path,
  CLIENT_ROUTES.signup.path,
  CLIENT_ROUTES.resetPassword.path,
  ...OFFLINE_ROUTES,
  ...WEB_ROUTES,
];
const DO_NOT_SAVE_ROUTES = [
  CLIENT_ROUTES.login.path,
  CLIENT_ROUTES.signup.path,
  ...OFFLINE_ROUTES,
];
export const DISALLOWED_ROUTES: string[] = [];

export const ROUTES_REGISTRY = {
  auth: AUTH_ROUTES,
  web: WEB_ROUTES,
  shell: [CLIENT_ROUTES.home.path, ...OFFLINE_ROUTES],
  post: POST_ROUTES,
  offline: OFFLINE_ROUTES,
  unprotected: UNPROTECTED_ROUTES,
  doNotSave: DO_NOT_SAVE_ROUTES,
};

// Server Api base routes
export const API_BASE = {
  auth: "/auth",
  user: "/user",
  // Posts
  post: "/post",
  feed: "/feed",
  gist: "/gist",
  // Upload
  upload: "/upload",
  // Report
  report: "/report",
  // Admin
  admin: "/admin",
  // Topic
  topic: "/topic",
};
// Server Api paths routes
export const SERVER_API = {
  // Auth
  login: `${API_BASE.auth}/session/login`,
  logout: `${API_BASE.auth}/session/logout`,
  verifyUserSession: `${API_BASE.auth}/session/verify`,
  refreshToken: `${API_BASE.auth}/session/refresh`,
  signup: `${API_BASE.auth}/signup`,
  checkEmail: `${API_BASE.auth}/check/email`,
  checkPhone: `${API_BASE.auth}/check/phone`,
  checkUsername: `${API_BASE.auth}/check/username`,
  sendMsgCode: `${API_BASE.auth}/otp/send`,
  verifyMsgCode: `${API_BASE.auth}/otp/verify`,
  resetMsgCode: `${API_BASE.auth}/otp/reset`,
  otpAccountUpdate: `${API_BASE.auth}/otp/update-account`,
  setupTotp: `${API_BASE.auth}/totp/setup`,
  verifyTotp: `${API_BASE.auth}/totp/verify`,
  setupSecurityQuestions: `${API_BASE.auth}/security-questions/setup`,
  fetchSecurityQuestions: `${API_BASE.auth}/security-questions`,
  verifySecurityQuestions: `${API_BASE.auth}/security-questions/verify`,
  verifyBot: `${API_BASE.auth}/verify-bot`,
  checkWhatsappStatus: `${API_BASE.auth}/whatsapp-status`,
  updateOnboarding: `${API_BASE.auth}/onboarding`,
  // Device
  getDevices: `${API_BASE.auth}/devices/`,
  setPrimaryDevice: (userId: string) =>
    `${API_BASE.auth}/devices/${userId}/primary`,
  removeDevice: (userId: string) => `${API_BASE.auth}/devices/${userId}`,

  // Media Standard Operations
  mediaUpload: `${API_BASE.upload}/get-upload-policy`,
  getMediaUrl: `${API_BASE.upload}/get-upload-url`,

  // Media Chunked Multipart Operations
  initMultipart: `${API_BASE.upload}/multipart/init`,
  signPart: `${API_BASE.upload}/multipart/sign-part`,
  completeMultipart: `${API_BASE.upload}/multipart/complete`,

  // Feed
  userFeed: (id: string) => `${API_BASE.feed}/${id}`,
  followersFeed: `${API_BASE.feed}/followers`,
  postSeen: (id: string) => `${API_BASE.post}/${id}/seen`,
  translateCaption: `${API_BASE.post}/translate/caption`,

  // Gists
  likeGist: (id: string) => `${API_BASE.gist}/${id}/like`,
  gists: `${API_BASE.gist}/feed`,
  createGist: `${API_BASE.gist}/create`,

  // Users
  getUser: (id: string) => `${API_BASE.user}/${id}`,
  followers: (id: string) => `${API_BASE.user}/${id}/followers`,
  follow: (id: string) => `${API_BASE.user}/${id}/follow`,
  initiateEmailChange: `${API_BASE.user}/change-email/initiate`,
  finalizeEmailChange: `${API_BASE.user}/change-email/finalize`,
  cancelEmailChange: `${API_BASE.user}/change-email/cancel`,
  initiatePhoneChange: `${API_BASE.user}/change-phone/initiate`,
  finalizePhoneChange: `${API_BASE.user}/change-phone/finalize`,
  changeUsername: `${API_BASE.user}/change-username`,
  updateBasicInfo: `${API_BASE.user}/update/basic`,
  initiatePasswordReset: `${API_BASE.user}/reset-password/initiate`,
  setPassword: `${API_BASE.user}/set-password`,
  changeAccountStatus: `${API_BASE.user}/account-status/change`,
  deleteAccount: `${API_BASE.user}/delete-account`,

  // Topics
  lookupTopics: `${API_BASE.topic}/search`,
};
