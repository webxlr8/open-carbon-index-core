import { intensityFor } from "./intensity";

// ccTLDs are ISO 3166-1 alpha-2 codes (that's where they come from), so a
// two-letter TLD maps directly to its own country — no proxy aliases.
// With the full Ember dataset in data/grid-intensity.csv (~200 countries),
// every real country resolves to its own grid; the handful of ccTLDs that
// aren't countries (.eu, .io, …) fall back to the global average inside
// intensityFor(). Generic TLDs (.com, .org, …) return null → global.
const TLD_EXCEPTIONS: Record<string, string> = {
  uk: "GB", // the one ccTLD that predates its ISO code
  su: "RU", // legacy Soviet TLD, hosted overwhelmingly in Russia
  ac: "SH", // Ascension Island administers under Saint Helena
};

// Some specific domains have known host countries that differ from their TLD.
const KNOWN_HOSTS: Record<string, string> = {
  "wikipedia.org": "US",
  "github.com": "US",
  "cloudflare.com": "US",
  "google.com": "US",
  "iana.org": "US",
};

/**
 * Curated host → country, for domains whose hosting country is publicly
 * documented. Takes precedence over inference (see resolveDatacenterCountry).
 */
export function knownHostCountry(domain: string): string | null {
  return KNOWN_HOSTS[domain.toLowerCase()] ?? null;
}

export function countryForDomain(domain: string): string | null {
  const lower = domain.toLowerCase();
  if (KNOWN_HOSTS[lower]) return KNOWN_HOSTS[lower];
  const parts = lower.split(".");
  if (parts.length < 2) return null;
  const tld = parts.at(-1);
  if (tld?.length !== 2) return null;
  return TLD_EXCEPTIONS[tld] ?? tld.toUpperCase();
}

// Returns the grid intensity in g CO2/kWh for the country that best matches
// the domain's hosting region. Falls back to the global average.
export function gridIntensityForDomain(domain: string): number {
  const country = countryForDomain(domain);
  return intensityFor(country);
}
