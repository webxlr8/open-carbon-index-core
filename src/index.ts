// Open Carbon Index — measurement core.
//
// Everything that produces or justifies a grade, and nothing else: no
// database, no web framework, no application state. Given a URL this
// measures it; given a measurement it computes a grade and renders a badge.
//
// Exports are sorted alphabetically by module (Biome enforces it). Grouped
// by concern: scan/ measures, grid/ locates and prices, badge/ renders.

export { parseBadgeParams, styleKey } from "./badge/params";
export type { BadgeData } from "./badge/render";
export { renderBadgeSvg } from "./badge/render";
export { svgToPng } from "./badge/render-png";
export type { ShieldData } from "./badge/render-shield";
export { renderShieldSvg, shieldValueText } from "./badge/render-shield";
export type {
  BadgeBackground,
  BadgeStyle,
  BadgeTheme,
  BadgeVariant,
} from "./badge/styles";
export {
  ATTRIBUTION,
  BADGE_DIMENSIONS,
  DEFAULT_STYLE,
  GRADE_COLORS,
  gradeColor,
  gradeTextColor,
  UNKNOWN_COLOR,
} from "./badge/styles";
export type { GridCategory } from "./grid/category";
export { gridIntensityCategory } from "./grid/category";
export {
  countryForDomain,
  gridIntensityForDomain,
  knownHostCountry,
} from "./grid/country-from-domain";
export {
  countryForIp,
  ipv4ToNumber,
  resolveDatacenterCountry,
  serverCountryForDomain,
} from "./grid/geo-ip";
export { intensityFor } from "./grid/intensity";
export { assetPath, dataPath } from "./paths";
export type { PerSegmentGridIntensity } from "./scan/compute";
export { computeCo2Segmented, SEGMENT_KWH_PER_GB } from "./scan/compute";
export type {
  CapturedResource,
  ScanDriver,
  ScanInput,
  ScanResult,
} from "./scan/driver";
export { findChrome } from "./scan/find-chrome";
export type { Grade } from "./scan/grade";
export { gradeFor } from "./scan/grade";
export type {
  GreencheckCache,
  GreencheckOptions,
  GreencheckRecord,
} from "./scan/greencheck";
export {
  clearGreenCache,
  createMemoryCache,
  isGreenHosted,
} from "./scan/greencheck";
export type { NormalizeOptions, NormalizeResult } from "./scan/normalize-url";
export {
  isBlockedHostname,
  isPrivateIp,
  normalizeUrl,
} from "./scan/normalize-url";
export { percentileRank, referencePercentile } from "./scan/percentile";
export { PuppeteerScanDriver } from "./scan/puppeteer-driver";
export { categorize } from "./scan/third-parties";
