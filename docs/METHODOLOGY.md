# Methodology

How Open Carbon Index turns a page load into grams of CO₂ and a grade —
and what the numbers do and don't mean.

## Measurement

A headless Chromium loads the submitted URL cold (browser cache disabled,
1366×900 viewport), waits for network idle plus a 2-second settle, and
records every network response via the Chrome DevTools Protocol. Bytes are
**wire bytes** — `encodedDataLength` from `Network.loadingFinished`, i.e.
what actually crossed the network including compression and headers. This
matters: measuring decoded body sizes (or trusting `content-length` on
chunked responses) overstates compressed pages several-fold.

One page view, first visit, single URL. We do not crawl, sample multiple
pages, or model return visits.

## Energy model — Sustainable Web Design Model v4

Per GB transferred ([sustainablewebdesign.org](https://sustainablewebdesign.org/estimating-digital-emissions/)):

| Segment | Operational | Embodied | Total kWh/GB |
|---------|-------------|----------|--------------|
| Datacenter | 0.055 | 0.012 | 0.067 |
| Network | 0.059 | 0.013 | 0.072 |
| User device | 0.080 | 0.081 | 0.161 |
| **Total** | **0.194** | **0.106** | **0.300** |

Each segment is multiplied by a grid carbon intensity:

- **Datacenter**: the grid of the country we infer for the server.
- **Network and device**: the global average — visitors and network hops
  are everywhere.

Our implementation is ~40 lines ([src/lib/scan/compute.ts](../src/lib/scan/compute.ts))
and is **cross-validated against [co2.js](https://github.com/thegreenwebfoundation/co2.js)**,
the Green Web Foundation's reference implementation: a CI test asserts our
output matches `co2.js` SWDM v4 `perByte` within 1% for both grey and green
hosting ([tests/unit/co2js-parity.test.ts](../tests/unit/co2js-parity.test.ts)).

## Grid intensity data

`data/grid-intensity.csv` holds ~210 countries from Ember's yearly
electricity data (CC-BY-4.0), republished in `@tgwf/co2`. Regenerate with
`node scripts/fetch-grid-intensity.mjs` after dependency updates; provenance
is stamped in the file header.

### Server country

We resolve the domain to an IPv4 address and look it up in an offline
registry table (`data/ip-country-ipv4.bin`, ~335k ranges built from
[ip-location-db](https://github.com/sapics/ip-location-db)'s
whois/ASN-derived country data, CC-BY-4.0 — attribution to
[nro.net](https://www.nro.net/)). Regenerate with
`node scripts/fetch-ip-country.mjs`.

Resolution order, most trustworthy first: **curated override → IP
geolocation → ccTLD → global average.** A two-letter ccTLD maps to its own
country (`.ch` → Switzerland — ccTLDs *are* ISO 3166 codes), with `.uk` →
GB and a couple of legacy exceptions special-cased. Curated entries
(`KNOWN_HOSTS` in `src/lib/grid/country-from-domain.ts`) win over inference
for domains whose hosting is publicly documented.

Known limitations, stated plainly:

- **CDN-fronted sites geolocate to the edge nearest our scanner.** DNS
  hands each resolver its closest PoP, so a site behind a global CDN
  reports whatever region answered us, not a canonical "origin" country —
  and the answer would differ if the scanner moved. Production scans all
  run from one region (`iad`), so published numbers are at least
  internally consistent; curated overrides exist to pin the biggest
  offenders. This is inherent to measuring anycast infrastructure from
  the outside, not a bug we can resolve with better data.
- **Anycast ranges report their registry country.** `1.1.1.1` resolves to
  AU because APNIC registered the block, though Cloudflare answers it from
  hundreds of locations. (`tests/unit/geo-ip.test.ts` asserts this so the
  behaviour stays visible rather than surprising someone later.)
- **IPv4 only.** A domain that resolves only over IPv6 falls back to its
  ccTLD. IPv6 range data would add ~17MB for a rare case.
- Registry country is where an address block is *allocated*, which is
  usually but not always where the machine physically sits.
- The error is bounded either way: the datacenter segment is 0.067 of
  0.300 kWh/GB (~22% of total energy), so even a wrong country moves the
  total by tens of percent at most, not multiples.

## Green hosting

The [Green Web Foundation greencheck](https://www.thegreenwebfoundation.org/)
verifies the host. Green hosting zeroes the **datacenter operational**
share only (0.055 kWh/GB ≈ 18% of total) — embodied energy exists no matter
who buys the electricity. Results are cached 30 days.

## Grades

Thresholds follow the Sustainable Web Design
[digital carbon rating scale](https://sustainablewebdesign.org/digital-carbon-ratings/):

| Grade | g CO₂/view | Web percentile |
|-------|-----------|----------------|
| A+ | ≤ 0.040 | cleanest 5% |
| A | ≤ 0.079 | cleanest 10% |
| B | ≤ 0.145 | cleanest 20% |
| C | ≤ 0.209 | cleanest 30% |
| D | ≤ 0.278 | cleanest 40% |
| E | ≤ 0.359 | cleanest 50% |
| F | > 0.359 | dirtier than median |

Grades are applied to the post-grid-intensity CO₂ value, so the same page
weight can grade differently depending on where it's hosted. That is the
point: hosting on a clean grid is a real, creditable choice.

## "Cleaner than X%"

Computed against a fixed public reference distribution
([data/reference-distribution.json](../data/reference-distribution.json)),
anchored on the percentile-defined SWD rating thresholds above, with the
above-median tail approximated from the HTTP Archive page-weight
distribution. It is **not** computed against our own scan history — a
self-referential percentile is meaningless while the index is small and
unstable as it grows. Once the index holds >10k domains, we intend to blend
observed data into the reference (and publish it).

## Freshness

- Scan results are cached 24 hours; re-submissions within that window
  return the cached result.
- A badge request for a scan older than 30 days triggers one background
  rescan (deduplicated, queue-capped). Embedded badges keep themselves
  fresh in proportion to how much they're seen; nothing rescans sites
  nobody looks at.

## Known limitations (candid list)

1. Single page view, cold cache — no return-visit weighting (SWDM v4
   supports it; we show the honest worst case).
2. Server country from IPv4 registry data — anycast/CDN and IPv6-only
   caveats above; bounded error.
3. Grid intensities are yearly averages, not marginal or hourly.
4. JavaScript executed after our 2s settle window isn't captured.
5. The SWDM attributional model itself has scope debates (see the
   [SWD methodology notes](https://sustainablewebdesign.org/estimating-digital-emissions/)) —
   we implement it faithfully rather than adjudicating them.
