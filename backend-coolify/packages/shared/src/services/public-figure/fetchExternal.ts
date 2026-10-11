import { IPublicFigureBase, IPublicFigureSignals } from "@repo/database";
import { TransInfo } from "../../types/general";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import {
  checkEmailReputation,
  checkPressCoverage,
  checkWikipedia,
  searchWikidata,
} from "./publicStatus";

export interface IFetchPublicFigureInput {
  displayName?: string | null;
  legalName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export type FetchStatus = "SUCCESS" | "INVALID_PAYLOAD" | "NO_DATA_FOUND";

interface IFetchExternalDataPayload extends IPublicFigureBase {
  legalNameMatched?: boolean;
}

export interface IFetchPublicFigureResult {
  status: FetchStatus;
  transInfo: TransInfo;
  data?: IFetchExternalDataPayload;
}

/** Normalize for comparison: lowercase, collapse spaces, strip punctuation. */
const normalizeName = (value?: string | null): string => {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * True if external legal name and user legal name refer to the same person name.
 * Allows either string to contain the other after normalization (order-safe enough for full names).
 */
export const legalNamesMatch = (
  externalLegalName?: string | null,
  userLegalName?: string | null,
): boolean => {
  const a = normalizeName(externalLegalName);
  const b = normalizeName(userLegalName);
  if (!a || !b) return false;
  if (a === b) return true;
  // e.g. "barack hussein obama" vs "barack obama"
  return a.includes(b) || b.includes(a);
};

export const calculateNotabilityScore = (
  signals: IPublicFigureSignals,
  options?: { legalNameMatched?: boolean },
): number => {
  let score = 0;
  if (signals.hasWikipedia) score += 40;
  if (signals.hasVipEmail) score += 10;
  if (signals.hasPressCoverage) score += 20;
  if (signals.isSearchVerified) score += 20;
  if (options?.legalNameMatched) score += 10;
  return Math.min(score, 100);
};

/**
 * Searches external sources for public-figure signals and profile fields.
 */
export const fetchExternalPublicFigure = async (
  input: IFetchPublicFigureInput,
): Promise<IFetchPublicFigureResult> => {
  const { displayName, legalName, email } = input;
  const finalName = displayName || legalName;

  if (!finalName) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.PROFILE.MISSING_NAMES,
    };
  }

  const [wikipedia, hasVipEmail, hasPressCoverage, wikidataInfo] =
    await Promise.all([
      checkWikipedia(finalName),
      email ? checkEmailReputation(email) : Promise.resolve(false),
      checkPressCoverage(finalName),
      searchWikidata(finalName),
    ]);

  const hasWikipedia = Boolean(wikipedia?.found);
  const isSearchVerified = Boolean(wikidataInfo?.signals?.isSearchVerified);

  const hasAnyValidSignal =
    hasWikipedia || hasVipEmail || hasPressCoverage || isSearchVerified;

  if (!hasAnyValidSignal) {
    return {
      status: "NO_DATA_FOUND",
      transInfo: MESSAGES_REGISTRY.PROFILE.EXTERNAL_RECORD_NOT_FOUND,
    };
  }

  const signals: IPublicFigureSignals = {
    hasWikipedia,
    hasVipEmail,
    hasPressCoverage,
    isSearchVerified,
  };

  const publicName =
    wikidataInfo?.publicName?.trim() ||
    wikipedia?.publicName?.trim() ||
    finalName;

  const externalLegalName = wikidataInfo?.legalName?.trim() || null;
  const legalNameMatched = legalNamesMatch(externalLegalName, legalName);

  const notabilityScore = calculateNotabilityScore(signals, {
    legalNameMatched,
  });

  const description =
    wikidataInfo?.description?.trim() || wikipedia?.description?.trim() || null;

  const publicFigureData: IFetchExternalDataPayload = {
    publicName,
    legalName: !legalNameMatched ? externalLegalName : legalName,
    legalNameMatched,
    publicEmail: wikidataInfo.publicEmail,
    category: wikidataInfo?.category,
    notabilityScore,
    networth: wikidataInfo?.networth ?? null,
    description,
    milestone: wikidataInfo?.milestone ?? null,
    notableWorks: wikidataInfo?.notableWorks ?? [],
    officialWebsite: wikidataInfo?.officialWebsite ?? null,
    socialLinks: wikidataInfo?.socialLinks ?? {},
    signals,
  };

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.EXTERNAL_DATA_FETCHED,
    data: publicFigureData,
  };
};
