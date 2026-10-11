"use client";
import { PLATFORM_PRIVACY_PAGE, StaticContentSection } from "@repo/core";

export const EFFECTIVE_DATE = "October 5, 2026";
export const LAST_UPDATED = "October 5, 2026";
export const SUPPORT_EMAIL = "support@funstakes.net";

export const SECTIONS: StaticContentSection[] = [
  {
    id: "who-we-are",
    title: PLATFORM_PRIVACY_PAGE.who_we_are.title,
    paragraphs: [
      PLATFORM_PRIVACY_PAGE.who_we_are.p1,
      PLATFORM_PRIVACY_PAGE.who_we_are.p2,
      {
        ...PLATFORM_PRIVACY_PAGE.who_we_are.p3,
        interpolations: { email: SUPPORT_EMAIL },
      },
    ],
  },
  {
    id: "information-we-collect",
    title: PLATFORM_PRIVACY_PAGE.information_we_collect.title,
    subsections: [
      {
        title:
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_you_provide.title,
        bullets: [
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_you_provide.b1,
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_you_provide.b2,
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_you_provide.b3,
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_you_provide.b4,
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_you_provide.b5,
        ],
      },
      {
        title:
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_third_party.title,
        paragraphs: [
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_third_party.p1,
        ],
      },
      {
        title: PLATFORM_PRIVACY_PAGE.information_we_collect.sub_automatic.title,
        bullets: [
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_automatic.b1,
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_automatic.b2,
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_automatic.b3,
        ],
      },
      {
        title:
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_other_sources.title,
        paragraphs: [
          PLATFORM_PRIVACY_PAGE.information_we_collect.sub_other_sources.p1,
        ],
      },
    ],
  },
  {
    id: "how-we-use-information",
    title: PLATFORM_PRIVACY_PAGE.how_we_use.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.how_we_use.p1],
    bullets: [
      PLATFORM_PRIVACY_PAGE.how_we_use.b1,
      PLATFORM_PRIVACY_PAGE.how_we_use.b2,
      PLATFORM_PRIVACY_PAGE.how_we_use.b3,
      PLATFORM_PRIVACY_PAGE.how_we_use.b4,
      PLATFORM_PRIVACY_PAGE.how_we_use.b5,
      PLATFORM_PRIVACY_PAGE.how_we_use.b6,
      PLATFORM_PRIVACY_PAGE.how_we_use.b7,
      PLATFORM_PRIVACY_PAGE.how_we_use.b8,
      PLATFORM_PRIVACY_PAGE.how_we_use.b9,
    ],
  },
  {
    id: "how-we-share-information",
    title: PLATFORM_PRIVACY_PAGE.how_we_share.title,
    paragraphs: [
      PLATFORM_PRIVACY_PAGE.how_we_share.p1,
      PLATFORM_PRIVACY_PAGE.how_we_share.p2,
    ],
    bullets: [
      PLATFORM_PRIVACY_PAGE.how_we_share.b1,
      PLATFORM_PRIVACY_PAGE.how_we_share.b2,
      PLATFORM_PRIVACY_PAGE.how_we_share.b3,
      PLATFORM_PRIVACY_PAGE.how_we_share.b4,
      PLATFORM_PRIVACY_PAGE.how_we_share.b5,
    ],
  },
  {
    id: "international-transfers",
    title: PLATFORM_PRIVACY_PAGE.international_transfers.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.international_transfers.p1],
  },
  {
    id: "cookies",
    title: PLATFORM_PRIVACY_PAGE.cookies.title,
    paragraphs: [
      PLATFORM_PRIVACY_PAGE.cookies.p1,
      PLATFORM_PRIVACY_PAGE.cookies.p2,
    ],
  },
  {
    id: "retention",
    title: PLATFORM_PRIVACY_PAGE.retention.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.retention.p1],
    bullets: [
      PLATFORM_PRIVACY_PAGE.retention.b1,
      PLATFORM_PRIVACY_PAGE.retention.b2,
      PLATFORM_PRIVACY_PAGE.retention.b3,
      PLATFORM_PRIVACY_PAGE.retention.b4,
    ],
  },
  {
    id: "security",
    title: PLATFORM_PRIVACY_PAGE.security.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.security.p1],
  },
  {
    id: "your-rights",
    title: PLATFORM_PRIVACY_PAGE.your_rights.title,
    paragraphs: [
      PLATFORM_PRIVACY_PAGE.your_rights.p1,
      {
        ...PLATFORM_PRIVACY_PAGE.your_rights.p2,
        interpolations: { email: SUPPORT_EMAIL },
      },
      PLATFORM_PRIVACY_PAGE.your_rights.p3,
    ],
  },
  {
    id: "children",
    title: PLATFORM_PRIVACY_PAGE.children.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.children.p1],
  },
  {
    id: "third-parties",
    title: PLATFORM_PRIVACY_PAGE.third_parties.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.third_parties.p1],
  },
  {
    id: "changes",
    title: PLATFORM_PRIVACY_PAGE.changes.title,
    paragraphs: [PLATFORM_PRIVACY_PAGE.changes.p1],
  },
  {
    id: "contact",
    title: PLATFORM_PRIVACY_PAGE.contact.title,
    paragraphs: [
      {
        ...PLATFORM_PRIVACY_PAGE.contact.p1,
        interpolations: { email: SUPPORT_EMAIL },
      },
    ],
  },
];
