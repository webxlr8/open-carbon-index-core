import puppeteer, { type Browser } from "puppeteer-core";
import type {
  CapturedResource,
  ScanDriver,
  ScanInput,
  ScanResult,
} from "./driver";
import { findChrome } from "./find-chrome";

// CDP resource types → our schema's enum.
const CDP_TYPE_MAP: Record<string, CapturedResource["type"]> = {
  Document: "html",
  Stylesheet: "css",
  Image: "image",
  Media: "media",
  Font: "font",
  Script: "script",
  XHR: "xhr",
  Fetch: "xhr",
};

interface PendingResponse {
  url: string;
  type: CapturedResource["type"];
  encoded: boolean;
  fromCache: boolean;
}

export class PuppeteerScanDriver implements ScanDriver {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) return this.browser;
    const exec = await findChrome();
    this.browser = await puppeteer.launch({
      executablePath: exec,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    return this.browser;
  }

  async scan(input: ScanInput): Promise<ScanResult> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // SWDM wants transfer (wire) bytes. content-length headers lie for
    // chunked responses and res.buffer() measures *decoded* size, so we
    // read encodedDataLength from CDP Network.loadingFinished — the actual
    // bytes that crossed the network, compression and headers included.
    const responses = new Map<string, PendingResponse>();
    const wireBytes = new Map<string, number>();

    try {
      await page.setViewport({ width: 1366, height: 900 });
      const cdp = await page.createCDPSession();
      await cdp.send("Network.enable");
      // Cold-cache measurement, reproducible across scans.
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

      cdp.on("Network.responseReceived", (e) => {
        if (e.response.url.startsWith("data:")) return;
        const headers = e.response.headers as Record<string, string>;
        const contentEncoding = (
          headers["content-encoding"] ??
          headers["Content-Encoding"] ??
          ""
        ).toLowerCase();
        responses.set(e.requestId, {
          url: e.response.url,
          type: CDP_TYPE_MAP[e.type] ?? "other",
          encoded:
            contentEncoding.includes("gzip") ||
            contentEncoding.includes("br") ||
            contentEncoding.includes("zstd"),
          fromCache: e.response.fromDiskCache === true,
        });
      });
      cdp.on("Network.loadingFinished", (e) => {
        wireBytes.set(e.requestId, e.encodedDataLength);
      });

      const inputHost = new URL(input.url).hostname;

      const collect = (): {
        resources: CapturedResource[];
        bytesTotal: number;
        requestCount: number;
      } => {
        const resources: CapturedResource[] = [];
        let bytesTotal = 0;
        for (const [requestId, meta] of responses) {
          const bytes = wireBytes.get(requestId) ?? 0;
          bytesTotal += bytes;
          let thirdPartyHost: string | null = null;
          try {
            const host = new URL(meta.url).hostname;
            thirdPartyHost = host !== inputHost ? host : null;
          } catch {
            /* keep null for unparseable URLs */
          }
          resources.push({
            type: meta.type,
            url: meta.url,
            bytes,
            encoded: meta.encoded,
            cached: meta.fromCache,
            thirdPartyHost,
          });
        }
        return { resources, bytesTotal, requestCount: resources.length };
      };

      try {
        await page.goto(input.url, {
          waitUntil: "networkidle0",
          timeout: 30_000,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          ...collect(),
          status: msg.includes("Timeout") ? "timeout" : "error",
          lcpMs: null,
          cls: null,
          fcpMs: null,
          ttfbMs: null,
          errorMessage: msg,
        };
      }

      // Wait 2s for late-firing scripts
      await new Promise((r) => setTimeout(r, 2000));

      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        const paints = performance.getEntriesByType("paint");
        const fcp =
          paints.find((p) => p.name === "first-contentful-paint")?.startTime ??
          null;
        const lcpEntries = performance.getEntriesByType(
          "largest-contentful-paint",
        );
        const lcp = lcpEntries.length
          ? lcpEntries[lcpEntries.length - 1]?.startTime
          : null;
        let cls = 0;
        for (const e of performance.getEntriesByType(
          "layout-shift",
        ) as PerformanceEntry[]) {
          const entry = e as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!entry.hadRecentInput) cls += entry.value;
        }
        return {
          lcpMs: lcp ? Math.round(lcp) : null,
          fcpMs: fcp ? Math.round(fcp) : null,
          ttfbMs: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
          cls: Math.round(cls * 1000) / 1000,
        };
      });

      return { ...collect(), status: "ok", ...metrics };
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
