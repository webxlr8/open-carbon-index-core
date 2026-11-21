# Changelog

Notable changes to the measurement core. Anything that could change a
published grade is called out explicitly, because grades are public claims
and people are entitled to know when the basis moved.

The format follows [Keep a Changelog](https://keepachangelog.com/1.1.0/),
and this project uses [semantic versioning](https://semver.org/).

## [Unreleased]

No change to how any grade is calculated.

### Fixed

- Compact badge: the grade chip and CO₂ figure no longer overlap the
  "opencarbonindex.org" line at the foot of the badge.
- Card badge: a site without verified green hosting now reads "not green
  hosted" instead of the meaningless "hosted", matching its accessible label.

### Changed

- Dependencies: zod 4.6.7, puppeteer-core 25.16.0; dev tooling (Biome 2.5,
  @types/node, Vitest, tsx); CI actions checkout v7, setup-node v7,
  pnpm/action-setup v6.
- satori stays on 0.26: 0.63 drops the badge's border and rounded corners
  and ignores its padding.

## [0.1.0] — 2026-08-07

First extraction from the Open Carbon Index website into a standalone,
inspectable package.

### Added

- SWDM v4 energy model (`computeCo2Segmented`), verified against the Green
  Web Foundation's co2.js to within 1% in CI.
- Headless-Chrome measurement using wire bytes (CDP `encodedDataLength`),
  cold cache, fixed 1366×900 viewport.
- A+ to F grading on the published Sustainable Web Design rating scale.
- Percentiles against a fixed public reference distribution rather than our
  own scan history.
- Grid carbon intensity for ~210 countries (Ember, CC-BY-4.0).
- IPv4 to country geolocation over ~335k ranges (NRO via ip-location-db,
  CC-BY-4.0), with curated overrides for CDN-fronted domains.
- Green hosting lookup with an injectable cache.
- URL normalisation with an SSRF guard for private, loopback, link-local
  and metadata addresses.
- Badge rendering in card, compact and shield variants, SVG and PNG, with
  `theme=auto` following the host page's colour scheme.

### Changed — affects grades

- **Grade E darkened** from `#e05a2a` to `#c04416`. The original failed
  WCAG AA with both light and dark text; the new value carries white text
  at 5.15:1. Grade boundaries are unchanged, so no site's grade moves.
