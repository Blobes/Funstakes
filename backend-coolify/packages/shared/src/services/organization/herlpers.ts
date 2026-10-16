import { APP_FREE_EMAIL_LIST } from "../../constants/others";
import { normalizeValue } from "../../utils/hash";

/** Domains that must never be treated as organization primary domains */
export const BLOCKED_ORG_DOMAINS = new Set(
  APP_FREE_EMAIL_LIST.map((d) => d.toLowerCase()),
);

/**
 * Extracts registrable-style host from a URL or bare domain.
 * https://www.Example.com/careers → example.com
 */
export const extractDomain = (raw?: string | null): string | null => {
  if (!raw) return null;
  let input = normalizeValue(raw).toLowerCase();
  if (!input) return null;

  try {
    if (!/^https?:\/\//i.test(input)) {
      input = `https://${input}`;
    }
    const host = new URL(input).hostname.replace(/^\.+|\.+$/g, "");
    if (!host || !host.includes(".")) return null;

    // strip leading www.
    const domain = host.startsWith("www.") ? host.slice(4) : host;

    if (BLOCKED_ORG_DOMAINS.has(domain)) return null;
    // block multi-label free hosts if list is only apex
    const parts = domain.split(".");
    if (parts.length >= 2) {
      const apex2 = parts.slice(-2).join(".");
      if (BLOCKED_ORG_DOMAINS.has(apex2)) return null;
    }
    return domain;
  } catch {
    return null;
  }
};

export const toNameCanonical = (name: string): string =>
  normalizeValue(name).toLowerCase().replace(/\s+/g, " ");
