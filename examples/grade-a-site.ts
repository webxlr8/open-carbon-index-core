/**
 * Measure a real page and grade it, end to end.
 *
 *   pnpm exec tsx examples/grade-a-site.ts https://example.com
 *
 * Needs a Chrome or Chromium binary (set CHROME_PATH if it isn't found
 * automatically). This is the whole pipeline the public index runs, minus
 * the database.
 */
import {
  computeCo2Segmented,
  gradeFor,
  intensityFor,
  normalizeUrl,
  PuppeteerScanDriver,
  referencePercentile,
  resolveDatacenterCountry,
} from "../src/index";

const input = process.argv[2] ?? "https://example.com";

// Same normalisation and SSRF guard the public API uses. Pass
// { allowPrivate: true } if you deliberately want to scan localhost.
const target = normalizeUrl(input);
if (!target.ok) {
  console.error(target.error);
  process.exit(1);
}

const driver = new PuppeteerScanDriver();
const result = await driver.scan({ url: target.url });
await driver.close();

if (result.status !== "ok") {
  console.error(`scan ${result.status}: ${result.errorMessage}`);
  process.exit(1);
}

// The datacentre segment is priced on the grid where the server actually
// is; network and device use the world average, because visitors and
// network hops are everywhere.
const { country, source } = await resolveDatacenterCountry(target.domain);
const world = intensityFor(null);
const co2 = computeCo2Segmented(
  result.bytesTotal / 1e9,
  { dataCenter: intensityFor(country), network: world, device: world },
  false, // green hosting — see isGreenHosted() to look this up
);

console.log(`
  ${target.domain}
  grade        ${gradeFor(co2)}
  CO2/view     ${(co2 * 1000).toFixed(2)} mg
  page weight  ${(result.bytesTotal / 1024).toFixed(0)} KB over ${result.requestCount} requests
  hosted in    ${country ?? "unknown"}${source ? ` (via ${source})` : ""} at ${intensityFor(country)} g CO2/kWh
  cleaner than ${referencePercentile(co2)}% of the web
`);
