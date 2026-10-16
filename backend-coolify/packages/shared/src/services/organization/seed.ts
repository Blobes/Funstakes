import {
  IOrganizationDocument,
  OrganizationModel,
  OrganizationSource,
} from "@repo/database";
import { AnyBulkWriteOperation } from "mongoose";
import { extractDomain, toNameCanonical } from "./herlpers";
import { fetchWikidataOrganizations, ORG_SEED_LIMIT } from "./wikidata";

export interface SeedOrganizationInput {
  name: string;
  primaryDomain: string;
  website?: string | null;
  country?: string | null;
  alternateDomains?: string[];
  logoUrl?: string | null;
  source?: OrganizationSource;
}

/**
 * Normalizes a single org payload; returns null if domain invalid / blocked.
 */
export const normalizeOrgSeed = (
  input: SeedOrganizationInput,
): SeedOrganizationInput | null => {
  const primaryDomain = extractDomain(input.primaryDomain || input.website);
  if (!primaryDomain) return null;

  const name = input.name?.trim();
  if (!name) return null;

  const alternates = (input.alternateDomains ?? [])
    .map((d) => extractDomain(d))
    .filter((d): d is string => Boolean(d) && d !== primaryDomain);

  return {
    name,
    primaryDomain,
    website: input.website ?? `https://${primaryDomain}`,
    country: input.country ?? null,
    alternateDomains: [...new Set(alternates)],
    logoUrl: input.logoUrl ?? null,
    source: input.source ?? "WIKIDATA",
  };
};

/**
 * Upserts organizations by primaryDomain.
 * - Never creates a second doc for the same domain
 * - Does not overwrite OWNER/ADMIN claim fields on existing rows
 * - Refreshes name/website/country only when source is SEED/WIKIDATA
 */
export const seedOrganizations = async (
  options: { limit?: number; rows?: SeedOrganizationInput[] } = {},
): Promise<void> => {
  const limit = options.limit ?? ORG_SEED_LIMIT;

  try {
    const remote =
      options.rows ??
      (await fetchWikidataOrganizations(limit)).map((r) => ({
        name: r.name,
        primaryDomain: r.primaryDomain,
        website: r.website,
        country: r.country,
        source: "WIKIDATA" as const,
      }));

    // In-batch dedupe by domain (last curated list order preserved via Map)
    const unique = new Map<string, SeedOrganizationInput>();
    for (const raw of remote) {
      const normalized = normalizeOrgSeed(raw);
      if (!normalized) continue;
      if (!unique.has(normalized.primaryDomain)) {
        unique.set(normalized.primaryDomain, normalized);
      }
    }

    const list = Array.from(unique.values()).slice(0, limit);
    if (!list.length) {
      console.warn("[OrgSeed] No organizations to seed.");
      return;
    }

    const operations: AnyBulkWriteOperation<IOrganizationDocument>[] = list.map(
      (org) => ({
        updateOne: {
          filter: { primaryDomain: org.primaryDomain },
          update: {
            $setOnInsert: {
              primaryDomain: org.primaryDomain,
              status: "ACTIVE",
              source: org.source ?? "WIKIDATA",
              addedByType: "SYSTEM",
              claimedByUserId: null,
              claimedAt: null,
              verification: {
                method: "SYSTEM_VERIFIED",
                verifiedAt: new Date(),
              },
              allowDomainJoin: true,
              alternateDomains: org.alternateDomains ?? [],
              logoUrl: org.logoUrl ?? null,
            },
            // Safe refresh for catalog fields only
            $set: {
              name: org.name,
              nameCanonical: toNameCanonical(org.name),
              website: org.website ?? `https://${org.primaryDomain}`,
              country: org.country ?? null,
            },
          },
          upsert: true,
        },
      }),
    );

    const result = await OrganizationModel.bulkWrite(operations, {
      ordered: false, // continue on single-doc errors
    });

    console.log(
      `[OrgSeed] done upserted=${result.upsertedCount} matched=${result.matchedCount} 
      modified=${result.modifiedCount} batch=${list.length}`,
    );
  } catch (error) {
    console.error("[OrgSeed] Failed to sync organizations:", error);
    throw error;
  }
};
