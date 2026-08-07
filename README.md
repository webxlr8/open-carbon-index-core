# Open Carbon Index — measurement core

[![CI](https://github.com/webxlr8/open-carbon-index-core/actions/workflows/ci.yml/badge.svg)](https://github.com/webxlr8/open-carbon-index-core/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-3e44b1)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-3e44b1)](.nvmrc)
[![Verified against co2.js](https://img.shields.io/badge/verified%20against-co2.js-0ae895)](tests/unit/co2js-parity.test.ts)

The part of [Open Carbon Index](https://github.com/webxlr8/OpenCarbonIndex)
that produces and justifies a grade: the website scanner, the Sustainable
Web Design Model v4 implementation, the grade thresholds, the percentile
reference, the grid-intensity and IP-to-country datasets, and the badge
renderer.

**Why this is public.** A grade is a claim about someone else's website,
published with their domain name attached. So the way it's calculated has
to be inspectable, re-runnable and open to dispute. You should never have
to take our word for a number.

The website that presents these grades is a separate, closed repository.
Nobody needs our stylesheet to check our maths.

## What's in here

| Area | What it does |
|---|---|
| `src/scan/` | Headless-Chrome measurement, SWDM v4 computation, grading, percentiles, URL normalisation and SSRF guarding, green-hosting lookup |
| `src/grid/` | Grid carbon intensity by country, IP geolocation, hosting-country resolution |
| `src/badge/` | Badge rendering — card, compact and shield variants, SVG and PNG |
| `data/` | Ember grid intensity (~210 countries), 335k IPv4→country ranges, the percentile reference distribution |
| `docs/METHODOLOGY.md` | The full method, including a candid list of what we get wrong |

## The claim you can check

Our energy model is about forty lines. A test asserts it matches
[co2.js](https://github.com/thegreenwebfoundation/co2.js) — the Green Web
Foundation's reference implementation — to within 1% for both green and
standard hosting, and CI fails if we ever drift from it.

```bash
pnpm install
pnpm test
```

Bytes are measured as **wire bytes** (Chrome DevTools Protocol
`encodedDataLength`) — what actually crossed the network, compression
included. Measuring decoded body sizes instead, which is the easy mistake,
overstates a compressed page several times over.

## Usage

```ts
import {
  computeCo2Segmented,
  gradeFor,
  intensityFor,
  PuppeteerScanDriver,
  referencePercentile,
} from "@opencarbonindex/core";

const driver = new PuppeteerScanDriver();
const result = await driver.scan({ url: "https://example.com" });
await driver.close();

const grid = intensityFor(null); // world average, g CO2/kWh
const co2 = computeCo2Segmented(
  result.bytesTotal / 1e9,
  { dataCenter: grid, network: grid, device: grid },
  false, // green hosted?
);

console.log(gradeFor(co2), co2, referencePercentile(co2));
```

Scanning needs a Chrome or Chromium binary. Common locations are
auto-detected on Linux, macOS and Windows; otherwise set `CHROME_PATH`.

Bundled datasets resolve relative to this package, so they work when it's
installed as a dependency. Override with `OCI_DATA_DIR` / `OCI_ASSET_DIR`
to ship your own refreshed data.

## Refreshing the data

```bash
pnpm data:grid   # Ember grid intensity, via @tgwf/co2
pnpm data:ip     # IPv4→country ranges, via ip-location-db
```

Both write files with a provenance header. Never hand-edit them.

## Try it on a real site

```bash
pnpm exec tsx examples/grade-a-site.ts https://example.com
```

Runs the full pipeline — measure, locate the host, price the grid, grade,
percentile — and prints the result.

## Repository layout

```
src/scan/    measurement, energy model, grading, percentiles, SSRF guard
src/grid/    grid intensity, IP geolocation, hosting-country resolution
src/badge/   badge rendering — card, compact, shield; SVG and PNG
src/paths.ts package-relative data resolution
data/        Ember grid intensity, IPv4->country ranges, percentile reference
scripts/     dataset regeneration, with provenance headers
docs/        METHODOLOGY.md — the full method and its known limitations
examples/    runnable end-to-end example
tests/unit/  including the co2.js parity test
```

## Contributing

Scepticism is the most useful contribution. If you think a number is wrong,
the method is in `docs/METHODOLOGY.md` and the code is here — a well-argued
issue about our maths is worth more to us than a feature request.

Corrections to the grid data, and hosting-country fixes for sites we get
wrong, are especially welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for
setup and the rules that keep grades honest, and
[SECURITY.md](SECURITY.md) for reporting vulnerabilities — the SSRF guard
and badge sanitisation are the areas most worth your attention.

## Licence

MIT © YIB Global Technology Services LLP. Built by
[WebXLR8](https://webxlr8.com) in India, for the whole web.

"Open Carbon Index", "WebXLR8" and the badge mark are trademarks — run and
fork this freely, but please use your own name and mark, so that a grade
carrying our badge always means a grade we issued.

Redistributed datasets keep their own licences: grid intensity from
[Ember](https://ember-energy.org/) (CC-BY-4.0), IP-to-country derived from
[NRO](https://www.nro.net/) statistics (CC-BY-4.0).
