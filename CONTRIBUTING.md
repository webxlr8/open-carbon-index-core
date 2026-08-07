# Contributing

The most valuable contribution here is **scepticism**. This repository
exists so that a grade we publish about someone's website can be checked by
the person receiving it. A well-argued issue about our maths is worth more
to us than a feature request.

## Getting set up

```bash
pnpm install
pnpm test
```

Scanning needs a Chrome or Chromium binary. Common locations are
auto-detected on Linux, macOS and Windows; otherwise set `CHROME_PATH`.

## Before opening a pull request

All four must pass — CI enforces them:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format
```

## What we especially want

- **Corrections to the numbers.** If a grade looks wrong, say so and show
  your working. Cite the page or figure you're questioning.
- **Grid data fixes**, with a source (Ember, IEA, or an official grid
  operator).
- **Hosting-country corrections** for sites we place wrongly — add them to
  `KNOWN_HOSTS` in `src/grid/country-from-domain.ts`. Curated entries beat
  IP geolocation on purpose, because CDN-fronted domains geolocate to
  whichever edge answered our scanner.
- **Methodology challenges.** See the limitations section of
  `docs/METHODOLOGY.md` — if you can close one of those gaps, we want to
  hear it.

## Rules that protect the project

1. **The grade must stay honest.** Nothing that lets a site present a
   better grade than it earned. Grade colour is never customisable.
2. **The energy model must match the reference.** `co2js-parity.test.ts`
   asserts we stay within 1% of the Green Web Foundation's co2.js. If your
   change breaks it, the change is wrong unless you can show the reference
   is.
3. **Measure wire bytes, never decoded sizes.** This is the single easiest
   way to be badly wrong about page weight.
4. **New runtime dependencies need a reason** the standard library doesn't
   cover. This package is embedded in a service that promises to be light.
5. **Never hand-edit `data/`.** Those files are generated — use
   `pnpm data:grid` and `pnpm data:ip`.

## Licence

MIT. By contributing you agree your contributions are MIT-licensed.
