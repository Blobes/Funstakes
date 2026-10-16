import { extractDomain, toNameCanonical } from "./herlpers";

export interface WikidataOrgRow {
  name: string;
  nameCanonical: string;
  primaryDomain: string;
  website: string;
  country?: string | null;
  wikidataId?: string;
}

type SparqlBinding = {
  item?: { value: string };
  itemLabel?: { value: string };
  website?: { value: string };
  countryLabel?: { value: string };
};

export const ORG_SEED_LIMIT = 500;

/**
 * Business enterprises (Q4830453) with official website (P856).
 * Prefer English labels; LIMIT applied server-side.
 */
const buildSparql = (limit: number) => `
SELECT DISTINCT ?item ?itemLabel ?website ?countryLabel WHERE {
  ?item wdt:P31/wdt:P279* wd:Q4830453 .
  ?item wdt:P856 ?website .
  OPTIONAL { ?item wdt:P17 ?country . }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,en-gb,en-ca,en-us".
  }
}
LIMIT ${limit * 3}
`;
// fetch 3x limit so after domain filtering / dedupe we still reach ~limit

/**
 * Pulls candidate organizations from Wikidata SPARQL endpoint.
 */
export const fetchWikidataOrganizations = async (
  limit: number = ORG_SEED_LIMIT,
): Promise<WikidataOrgRow[]> => {
  const endpoint = "https://query.wikidata.org/sparql";
  const query = buildSparql(limit);

  const response = await fetch(
    `${endpoint}?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "FunstakesOrgSeed/1.0 (support@funstakes.net)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Wikidata SPARQL failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as {
    results?: { bindings?: SparqlBinding[] };
  };
  const bindings = json.results?.bindings ?? [];

  const byDomain = new Map<string, WikidataOrgRow>();

  for (const row of bindings) {
    const name = row.itemLabel?.value?.trim();
    const website = row.website?.value?.trim();
    if (!name || !website) continue;
    // skip unresolved Q-ids as labels
    if (/^Q\d+$/i.test(name)) continue;

    const primaryDomain = extractDomain(website);
    if (!primaryDomain) continue;

    // first write wins (deterministic enough for seed)
    if (byDomain.has(primaryDomain)) continue;

    const itemIri = row.item?.value ?? "";
    const wikidataId = itemIri.split("/").pop();

    byDomain.set(primaryDomain, {
      name,
      nameCanonical: toNameCanonical(name),
      primaryDomain,
      website: website.startsWith("http") ? website : `https://${website}`,
      country:
        row.countryLabel?.value && !/^Q\d+$/i.test(row.countryLabel.value)
          ? row.countryLabel.value
          : null,
      wikidataId,
    });

    if (byDomain.size >= limit) break;
  }

  return Array.from(byDomain.values());
};
