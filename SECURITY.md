# Security policy

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.

Use GitHub's [private vulnerability
reporting](https://github.com/webxlr8/open-carbon-index-core/security/advisories/new),
or email **security@webxlr8.com**.

We'll acknowledge within 72 hours and keep you updated as we work on a fix.

## Scope

This package runs a headless browser against arbitrary URLs, so the areas
most worth your attention are:

- **SSRF.** `src/scan/normalize-url.ts` rejects localhost, private and
  link-local ranges, cloud metadata addresses and internal-looking
  hostnames. A bypass is a genuine vulnerability — please report it.
  Note the documented residual risk: DNS rebinding between the pre-flight
  check and page load.
- **The scanner.** `src/scan/puppeteer-driver.ts` loads untrusted pages.
  Anything that escapes the browser sandbox or reaches the host matters.
- **SVG injection.** Badge parameters are sanitised in
  `src/badge/params.ts` and escaped in `src/badge/render-shield.ts`. A way
  to inject markup into a rendered badge is a vulnerability, because those
  badges are embedded on third-party sites.

## Out of scope

Disagreement with a carbon figure is not a security issue — that's a
methodology question, and we welcome it as a normal public issue.
