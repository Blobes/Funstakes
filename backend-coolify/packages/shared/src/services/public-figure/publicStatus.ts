import dns from "node:dns/promises";
//import { domains as disposableDomains } from "disposable-email-domain";
// import freeEmailDomains from "free-email-domains";
import type { IPublicFigureBase } from "@repo/database";
import {
  APP_FREE_EMAIL_LIST,
  APP_DISPOSABLE_DOMAINS,
} from "../../constants/others";

export type WikipediaLookupResult = {
  found: boolean;
  publicName?: string | null;
  description?: string | null;
};

// Build Set once at module load (startup)

/**
 * Evaluates domain/email reputation
 */
export const checkEmailReputation = async (email: string): Promise<boolean> => {
  if (!email || !email.includes("@")) return false;

  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;

  const FREE_DOMAINS = new Set(
    // ...(freeEmailDomains as string[]).map((d) => d.toLowerCase()),
    APP_FREE_EMAIL_LIST,
  );

  const DISPOSABLE_DOMAINS = new Set(
    // ...disposableDomains.map((d) => d.toLowerCase()),
    APP_DISPOSABLE_DOMAINS,
  );

  // 1) Free / consumer webmail
  if (FREE_DOMAINS.has(domain)) return false;

  // 2) Disposable / temp-mail (package accepts email or domain)
  if (DISPOSABLE_DOMAINS.has(domain)) return false;

  // 3) Must have MX records
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx?.length) return false;
  } catch {
    return false;
  }
  return true;
};

/**
 * Checks Wikipedia for a page matching the query and returns title + intro extract when present.
 */
export const checkWikipedia = async (
  fullName: string,
): Promise<WikipediaLookupResult> => {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
      fullName,
    )}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    type WikipediaPage = {
      pageid?: number;
      title?: string;
      extract?: string;
      missing?: boolean;
    };

    type WikipediaApiResponse = {
      query: {
        pages: Record<string, WikipediaPage>;
      };
    };

    const data = (await response.json()) as WikipediaApiResponse;
    const pages = data.query.pages;
    const page = Object.values(pages)[0];

    if (
      !page ||
      page.missing ||
      Object.prototype.hasOwnProperty.call(pages, "-1")
    ) {
      return { found: false };
    }

    return {
      found: true,
      publicName: page.title ?? null,
      description: page.extract?.trim() || null,
    };
  } catch (error) {
    console.error("Wikipedia API Error:", error);
    return { found: false };
  }
};

/**
 * Validates phone line carrier details via Twilio Lookup.
 */
export const checkPhoneIntelligence = async (
  phoneNumber: string,
): Promise<boolean> => {
  if (!phoneNumber) return false;

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      console.warn(
        "Twilio credentials are not set — skipping phone intelligence check.",
      );
      return false;
    }

    const response = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(
        phoneNumber,
      )}?Fields=line_type_intelligence`,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    type TwilioLookupResponse = {
      line_type_intelligence?: {
        type?: string;
        carrier_name?: string | null;
      };
    };

    const data = (await response.json()) as TwilioLookupResponse;
    const lineType = data.line_type_intelligence?.type;
    const carrier = data.line_type_intelligence?.carrier_name;
    const isReliableType = lineType === "mobile" || lineType === "landline";
    const isRealCarrier = Boolean(carrier);

    return isReliableType && isRealCarrier;
  } catch (err) {
    console.error("Phone Intelligence API Error:", err);
    return false;
  }
};

/**
 * Checks GDELT for recent press coverage matching the full name.
 */
export const checkPressCoverage = async (
  fullName: string,
): Promise<boolean> => {
  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
      `"${fullName}"`,
    )}&mode=artlist&maxrecords=5&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    type GdeltResponse = {
      articles?: unknown[];
    };

    const data = (await response.json()) as GdeltResponse;
    return Array.isArray(data.articles) && data.articles.length > 0;
  } catch (error) {
    console.error("GDELT Press Coverage API Error:", error);
    return false;
  }
};

type WikidataClaim = {
  mainsnak?: {
    datavalue?: {
      value?: unknown;
      type?: string;
    };
  };
};

const claimString = (
  claims: Record<string, WikidataClaim[] | undefined> | undefined,
  prop: string,
): string | undefined => {
  const value = claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;
  if (typeof value === "string") return value;
  // monolingualtext: { text, language }
  if (value && typeof value === "object" && "text" in value) {
    return String((value as { text: string }).text);
  }
  return undefined;
};

const claimStrings = (
  claims: Record<string, WikidataClaim[] | undefined> | undefined,
  prop: string,
): string[] => {
  if (!claims?.[prop]?.length) return [];
  return claims[prop]
    .map((c) => {
      const v = c.mainsnak?.datavalue?.value;
      if (typeof v === "string") return v;
      if (v && typeof v === "object" && "text" in v) {
        return String((v as { text: string }).text);
      }
      return null;
    })
    .filter((v): v is string => Boolean(v));
};

const claimEntityIds = (
  claims: Record<string, WikidataClaim[] | undefined> | undefined,
  prop: string,
): string[] => {
  if (!claims?.[prop]?.length) return [];
  return claims[prop]
    .map((c) => {
      const v = c.mainsnak?.datavalue?.value;
      if (v && typeof v === "object" && "id" in v) {
        return String((v as { id: string }).id);
      }
      return null;
    })
    .filter((v): v is string => Boolean(v));
};

const resolveEntityLabels = async (
  ids: string[],
): Promise<Record<string, string>> => {
  if (!ids.length) return {};
  const unique = [...new Set(ids)];
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${unique.join(
    "|",
  )}&languages=en&props=labels&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const data = (await res.json()) as {
    entities?: Record<string, { labels?: { en?: { value?: string } } }>;
  };
  const out: Record<string, string> = {};
  for (const id of unique) {
    const label = data.entities?.[id]?.labels?.en?.value;
    if (label) out[id] = label;
  }
  return out;
};

/**
 * Wikidata: public name, description, optional legal/birth name, rare email,
 * website, socials, notable works.
 */
export const searchWikidata = async (
  fullName: string,
): Promise<
  Partial<IPublicFigureBase> & {
    legalName?: string | null;
    officialEmail?: string | null;
  }
> => {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      fullName,
    )}&language=en&format=json&origin=*&limit=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok)
      throw new Error(`HTTP error! status: ${searchRes.status}`);

    type WikidataSearchResponse = {
      search?: Array<{ id: string; label?: string; description?: string }>;
    };
    const searchData = (await searchRes.json()) as WikidataSearchResponse;
    const hit = searchData.search?.[0];
    if (!hit?.id) return {};

    const entityId = hit.id;
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    const entityRes = await fetch(entityUrl);
    if (!entityRes.ok)
      throw new Error(`HTTP error! status: ${entityRes.status}`);

    type WikidataEntityResponse = {
      entities?: Record<
        string,
        {
          labels?: Record<string, { value?: string }>;
          descriptions?: Record<string, { value?: string }>;
          claims?: Record<string, WikidataClaim[]>;
        }
      >;
    };

    const entityData = (await entityRes.json()) as WikidataEntityResponse;
    const entity = entityData.entities?.[entityId];
    if (!entity) return {};

    const claims = entity.claims;
    const publicName = entity.labels?.en?.value ?? hit.label ?? null;
    const description =
      entity.descriptions?.en?.value ?? hit.description ?? null;

    // Legal / birth name: P1477 (birth name text) or P735+P734 (given + family)
    const birthName = claimString(claims, "P1477");
    const givenIds = claimEntityIds(claims, "P735");
    const familyIds = claimEntityIds(claims, "P734");
    const nameLabels = await resolveEntityLabels([...givenIds, ...familyIds]);
    const givenNames = givenIds.map((id) => nameLabels[id]).filter(Boolean);
    const familyNames = familyIds.map((id) => nameLabels[id]).filter(Boolean);
    const composedLegal = [...givenNames, ...familyNames].join(" ").trim();
    const legalName = birthName?.trim() || composedLegal || null;

    // P968 email (rarely populated)
    const emailRaw = claimString(claims, "P968");
    const officialEmail = emailRaw
      ? emailRaw.replace(/^mailto:/i, "").trim()
      : null;

    const officialWebsite = claimString(claims, "P856") ?? null;
    const twitterHandle = claimString(claims, "P2002");
    const instagramHandle = claimString(claims, "P2003");
    const facebookHandle = claimString(claims, "P2013");
    const youtubeHandle = claimString(claims, "P2397");
    const tiktokHandle = claimString(claims, "P7085");
    const notableWorks = claimStrings(claims, "P800");

    const socialLinks: Record<string, string> = {
      ...(twitterHandle && { twitter: `https://x.com/${twitterHandle}` }),
      ...(instagramHandle && {
        instagram: `https://instagram.com/${instagramHandle}`,
      }),
      ...(facebookHandle && {
        facebook: `https://facebook.com/${facebookHandle}`,
      }),
      ...(youtubeHandle && {
        youtube: `https://youtube.com/${youtubeHandle}`,
      }),
      ...(tiktokHandle && { tiktok: `https://tiktok.com/@${tiktokHandle}` }),
    };

    return {
      publicName,
      description,
      legalName,
      publicEmail: officialEmail,
      officialWebsite,
      ...(Object.keys(socialLinks).length > 0 && { socialLinks }),
      ...(notableWorks.length > 0 && { notableWorks }),
      signals: {
        isSearchVerified: true,
      },
    };
  } catch (error) {
    console.error("Wikidata Search Error:", error);
    return {};
  }
};
