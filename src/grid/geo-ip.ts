import dns from "node:dns/promises";
import fs from "node:fs";
import { dataPath } from "../paths";
import { countryForDomain, knownHostCountry } from "./country-from-domain";

// Offline IPv4 → country lookup over the compact table built by
// scripts/fetch-ip-country.mjs. This is how a site's *server* country is
// determined; the ccTLD is only a fallback. Data: ip-location-db
// (NRO/whois/ASN derived), CC-BY-4.0 — attribution in README/METHODOLOGY.
//
// ~2MB on disk, lazily loaded into typed arrays on first use, so the web
// process (which never geolocates) never pays for it.

interface Table {
  starts: Uint32Array;
  idxs: Uint16Array;
  codes: string[];
}

let table: Table | null = null;
let loadFailed = false;

function load(): Table | null {
  if (table) return table;
  if (loadFailed) return null;
  try {
    const file = dataPath("ip-country-ipv4.bin");
    const buf = fs.readFileSync(file);
    if (buf.toString("ascii", 0, 4) !== "OCIP" || buf.readUInt8(4) !== 1) {
      throw new Error("unexpected ip-country table format");
    }
    const codeCount = buf.readUInt16LE(6);
    const count = buf.readUInt32LE(8);
    const codes: string[] = [];
    for (let i = 0; i < codeCount; i++) {
      codes.push(buf.toString("ascii", 12 + i * 2, 14 + i * 2));
    }
    const startsOff = 12 + codeCount * 2;
    const idxOff = startsOff + count * 4;
    const starts = new Uint32Array(count);
    const idxs = new Uint16Array(count);
    for (let i = 0; i < count; i++) {
      starts[i] = buf.readUInt32LE(startsOff + i * 4);
      idxs[i] = buf.readUInt16LE(idxOff + i * 2);
    }
    table = { starts, idxs, codes };
    return table;
  } catch (e) {
    // Missing or corrupt table must not break scanning — callers fall
    // back to ccTLD inference.
    loadFailed = true;
    console.warn(
      `[geo-ip] table unavailable, falling back to ccTLD: ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

/** Dotted-quad IPv4 string → unsigned 32-bit number, or null if malformed. */
export function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const v = Number(part);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

/** ISO 3166-1 alpha-2 country for an IPv4 address, or null if unknown. */
export function countryForIp(ip: string): string | null {
  const t = load();
  if (!t) return null;
  const n = ipv4ToNumber(ip);
  if (n === null) return null;

  // Largest entry whose start <= n. Entries are contiguous (gaps are
  // explicit "??" rows), so no end-of-range check is needed.
  let lo = 0;
  let hi = t.starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if ((t.starts[mid] ?? 0) <= n) lo = mid;
    else hi = mid - 1;
  }
  const code = t.codes[t.idxs[lo] ?? 0];
  return !code || code === "??" ? null : code;
}

/**
 * Country of the server behind a domain: resolve to IPv4, then look up.
 * Returns null when the domain doesn't resolve over IPv4 or the address
 * isn't in the table — callers fall back to ccTLD, then global average.
 */
export async function serverCountryForDomain(
  domain: string,
): Promise<string | null> {
  try {
    const { address } = await dns.lookup(domain, { family: 4 });
    return countryForIp(address);
  } catch {
    return null;
  }
}

/**
 * The country whose grid we bill the datacenter segment to, in order of
 * trustworthiness: curated override → IP geolocation → ccTLD → null
 * (caller uses the global average).
 *
 * Curated entries win deliberately. For CDN-fronted domains, DNS hands the
 * scanner its *nearest* edge, so IP geolocation would otherwise make the
 * result depend on where the scanner runs. See docs/METHODOLOGY.md.
 */
export async function resolveDatacenterCountry(
  domain: string,
): Promise<{ country: string | null; source: "known" | "ip" | "tld" | null }> {
  const known = knownHostCountry(domain);
  if (known) return { country: known, source: "known" };

  const byIp = await serverCountryForDomain(domain);
  if (byIp) return { country: byIp, source: "ip" };

  const byTld = countryForDomain(domain);
  if (byTld) return { country: byTld, source: "tld" };

  return { country: null, source: null };
}
