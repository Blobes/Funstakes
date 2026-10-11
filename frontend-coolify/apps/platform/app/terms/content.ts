"use client";

import { Theme } from "@mui/material/styles";
import { PLATFORM_TERMS_PAGE, StaticContentSection } from "@repo/core";

export const EFFECTIVE_DATE = "October 5, 2026";
export const LAST_UPDATED = "October 5, 2026";
export const SUPPORT_EMAIL = "support@funstakes.net";

export const getSectionStyle = (theme: Theme) => {
  const titleSx = {
    ...theme.typography.h6,
    color: theme.palette.gray[300],
    fontWeight: 700,
  };
  const bodySx = {
    ...theme.typography.text3,
    color: theme.palette.gray[300],
  };
  const metaSx = {
    ...theme.typography.text3,
    color: theme.palette.gray[200],
    borderTop: `1px solid ${theme.palette.gray.trans[2]}`,
    borderBottom: `1px solid ${theme.palette.gray.trans[2]}`,
    paddingY: theme.boxSpacing(4),
  };
  const linkSx = {
    color: theme.palette.primary.dark,
    "&:hover": {
      textDecoration: "underline",
      fontWeight: 600,
    },
  };

  return { titleSx, bodySx, metaSx, linkSx };
};

export const SECTIONS: StaticContentSection[] = [
  {
    id: "agreement",
    title: PLATFORM_TERMS_PAGE.agreement.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.agreement.p1,
      PLATFORM_TERMS_PAGE.agreement.p2,
    ],
  },
  {
    id: "eligibility",
    title: PLATFORM_TERMS_PAGE.eligibility.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.eligibility.p1,
      PLATFORM_TERMS_PAGE.eligibility.p2,
    ],
  },
  {
    id: "accounts",
    title: PLATFORM_TERMS_PAGE.accounts.title,
    paragraphs: [PLATFORM_TERMS_PAGE.accounts.p1],
    bullets: [
      PLATFORM_TERMS_PAGE.accounts.bullets.b1,
      PLATFORM_TERMS_PAGE.accounts.bullets.b2,
      PLATFORM_TERMS_PAGE.accounts.bullets.b3,
      PLATFORM_TERMS_PAGE.accounts.bullets.b4,
    ],
  },
  {
    id: "services",
    title: PLATFORM_TERMS_PAGE.services.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.services.p1,
      PLATFORM_TERMS_PAGE.services.p2,
    ],
  },
  {
    id: "user-content",
    title: PLATFORM_TERMS_PAGE.user_content.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.user_content.p1,
      PLATFORM_TERMS_PAGE.user_content.p2,
      PLATFORM_TERMS_PAGE.user_content.p3,
    ],
  },
  {
    id: "prohibited",
    title: PLATFORM_TERMS_PAGE.prohibited.title,
    paragraphs: [PLATFORM_TERMS_PAGE.prohibited.p1],
    bullets: [
      PLATFORM_TERMS_PAGE.prohibited.bullets.b1,
      PLATFORM_TERMS_PAGE.prohibited.bullets.b2,
      PLATFORM_TERMS_PAGE.prohibited.bullets.b3,
      PLATFORM_TERMS_PAGE.prohibited.bullets.b4,
      PLATFORM_TERMS_PAGE.prohibited.bullets.b5,
      PLATFORM_TERMS_PAGE.prohibited.bullets.b6,
      PLATFORM_TERMS_PAGE.prohibited.bullets.b7,
    ],
  },
  {
    id: "verification",
    title: PLATFORM_TERMS_PAGE.verification.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.verification.p1,
      PLATFORM_TERMS_PAGE.verification.p2,
    ],
  },
  {
    id: "payments",
    title: PLATFORM_TERMS_PAGE.payments.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.payments.p1,
      PLATFORM_TERMS_PAGE.payments.p2,
    ],
  },
  {
    id: "ip",
    title: PLATFORM_TERMS_PAGE.ip.title,
    paragraphs: [PLATFORM_TERMS_PAGE.ip.p1, PLATFORM_TERMS_PAGE.ip.p2],
  },
  {
    id: "third-party",
    title: PLATFORM_TERMS_PAGE.third_party.title,
    paragraphs: [PLATFORM_TERMS_PAGE.third_party.p1],
  },
  {
    id: "disclaimers",
    title: PLATFORM_TERMS_PAGE.disclaimers.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.disclaimers.p1,
      PLATFORM_TERMS_PAGE.disclaimers.p2,
    ],
  },
  {
    id: "liability",
    title: PLATFORM_TERMS_PAGE.liability.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.liability.p1,
      PLATFORM_TERMS_PAGE.liability.p2,
    ],
  },
  {
    id: "indemnification",
    title: PLATFORM_TERMS_PAGE.indemnification.title,
    paragraphs: [PLATFORM_TERMS_PAGE.indemnification.p1],
  },
  {
    id: "termination",
    title: PLATFORM_TERMS_PAGE.termination.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.termination.p1,
      PLATFORM_TERMS_PAGE.termination.p2,
    ],
  },
  {
    id: "governing-law",
    title: PLATFORM_TERMS_PAGE.governing_law.title,
    paragraphs: [
      PLATFORM_TERMS_PAGE.governing_law.p1,
      PLATFORM_TERMS_PAGE.governing_law.p2,
    ],
  },
  {
    id: "changes",
    title: PLATFORM_TERMS_PAGE.changes.title,
    paragraphs: [PLATFORM_TERMS_PAGE.changes.p1],
  },
  {
    id: "contact",
    title: PLATFORM_TERMS_PAGE.contact.title,
    paragraphs: [
      {
        ...PLATFORM_TERMS_PAGE.contact.p1,
        interpolations: { email: SUPPORT_EMAIL },
      },
    ],
  },
];
