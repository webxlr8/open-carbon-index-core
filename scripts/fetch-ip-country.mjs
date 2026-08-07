// Regenerates data/ip-country-ipv4.bin — the IPv4 → country lookup table
// used to geolocate a site's server (and therefore its datacenter grid).
//
// Source: ip-location-db "geo-whois-asn-country" (NRO/whois/ASN-derived),
// CC-BY-4.0, attribution to nro.net. Fetched from a pinned npm tarball so
// regeneration is reproducible and costs nothing at install time.
//
// Run: node scripts/fetch-ip-country.mjs
import { writeFileSync } from "node:fs";
import zlib from "node:zlib";

const PKG = "@ip-location-db/geo-whois-asn-country";
const VERSION = "2.3.2026061719";
const TARBALL = `https://registry.npmjs.org/${PKG}/-/geo-whois-asn-country-${VERSION}.tgz`;
const WANTED = "geo-whois-asn-country-ipv4-num.csv";
const OUT = "data/ip-country-ipv4.bin";

// Minimal tar reader: 512-byte headers, name at 0, size (octal) at 124.
function extractFromTar(buf, suffix) {
  let off = 0;
  while (off + 512 <= buf.length) {
    const name = buf.toString("utf8", off, off + 100).replace(/\0.*$/, "");
    const sizeStr = buf
      .toString("ascii", off + 124, off + 136)
      .replace(/\0.*$/, "")
      .trim();
    if (!name) {
      off += 512;
      continue;
    }
    const size = Number.parseInt(sizeStr, 8) || 0;
    const start = off + 512;
    if (name.endsWith(suffix)) return buf.subarray(start, start + size);
    off = start + Math.ceil(size / 512) * 512;
  }
  throw new Error(`${suffix} not found in tarball`);
}

const res = await fetch(TARBALL);
if (!res.ok) throw new Error(`fetch ${TARBALL}: ${res.status}`);
const tar = zlib.gunzipSync(Buffer.from(await res.arrayBuffer()));
const csv = extractFromTar(tar, WANTED).toString("utf8");

// Parse: start_num,end_num,CC
const raw = [];
for (const line of csv.split("\n")) {
  if (!line) continue;
  const [s, e, cc] = line.split(",");
  if (!s || !e || !cc) continue;
  raw.push([Number(s), Number(e), cc.trim().toUpperCase()]);
}
raw.sort((a, b) => a[0] - b[0]);

// Country table; index 0 is reserved for "unknown / unallocated".
const codes = ["??"];
const codeIndex = new Map([["??", 0]]);
const idxFor = (cc) => {
  let i = codeIndex.get(cc);
  if (i === undefined) {
    i = codes.length;
    codes.push(cc);
    codeIndex.set(cc, i);
  }
  return i;
};

// Flatten into (start, countryIdx) pairs: gaps become explicit "unknown"
// entries so a lookup is a single binary search with no range check.
const starts = [];
const idxs = [];
let cursor = 0;
for (const [s, e, cc] of raw) {
  if (s > cursor) {
    starts.push(cursor);
    idxs.push(0);
  } else if (s < cursor) {
    continue; // overlapping/duplicate range, first wins
  }
  const ci = idxFor(cc);
  if (idxs.length > 0 && idxs[idxs.length - 1] === ci) {
    // adjacent run of the same country — extend instead of adding a row
  } else {
    starts.push(s);
    idxs.push(ci);
  }
  cursor = e + 1;
}
starts.push(cursor);
idxs.push(0); // tail: everything above the last allocated range is unknown

if (codes.length > 65535) throw new Error("too many country codes for uint16");

const count = starts.length;
const headerLen = 12 + codes.length * 2;
const buf = Buffer.alloc(headerLen + count * 4 + count * 2);
buf.write("OCIP", 0, "ascii");
buf.writeUInt8(1, 4); // format version
buf.writeUInt8(0, 5);
buf.writeUInt16LE(codes.length, 6);
buf.writeUInt32LE(count, 8);
for (const [i, cc] of codes.entries()) {
  buf.write(cc.padEnd(2, "?").slice(0, 2), 12 + i * 2, "ascii");
}
const startsOff = headerLen;
const idxOff = headerLen + count * 4;
for (let i = 0; i < count; i++) {
  buf.writeUInt32LE(starts[i], startsOff + i * 4);
  buf.writeUInt16LE(idxs[i], idxOff + i * 2);
}

writeFileSync(OUT, buf);
console.log(
  `wrote ${OUT}: ${count} entries, ${codes.length - 1} countries, ` +
    `${(buf.length / 1024 / 1024).toFixed(2)} MB (from ${PKG}@${VERSION}, ${raw.length} source ranges)`,
);
