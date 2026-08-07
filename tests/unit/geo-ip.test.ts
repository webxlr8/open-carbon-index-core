import { describe, expect, it } from "vitest";
import {
  countryForIp,
  ipv4ToNumber,
  resolveDatacenterCountry,
} from "@/grid/geo-ip";

describe("ipv4ToNumber", () => {
  it("converts dotted quads", () => {
    expect(ipv4ToNumber("0.0.0.0")).toBe(0);
    expect(ipv4ToNumber("1.0.0.0")).toBe(16777216);
    expect(ipv4ToNumber("255.255.255.255")).toBe(4294967295);
    expect(ipv4ToNumber("8.8.8.8")).toBe(134744072);
  });
  it("rejects malformed input", () => {
    expect(ipv4ToNumber("8.8.8")).toBeNull();
    expect(ipv4ToNumber("256.0.0.1")).toBeNull();
    expect(ipv4ToNumber("a.b.c.d")).toBeNull();
    expect(ipv4ToNumber("::1")).toBeNull();
    expect(ipv4ToNumber("")).toBeNull();
  });
});

describe("countryForIp", () => {
  it("locates well-known public addresses", () => {
    expect(countryForIp("8.8.8.8")).toBe("US"); // Google DNS
    expect(countryForIp("13.107.42.14")).toBe("US"); // Microsoft
  });
  it("reports registry country for anycast ranges (documented caveat)", () => {
    // 1.1.1.0/24 is APNIC-registered (AU) even though Cloudflare anycasts
    // it worldwide. Registry data cannot see anycast — this is the CDN
    // limitation called out in docs/METHODOLOGY.md, asserted so the
    // behaviour stays visible rather than surprising someone later.
    expect(countryForIp("1.1.1.1")).toBe("AU");
  });
  it("returns null for unroutable / unallocated space", () => {
    expect(countryForIp("0.0.0.1")).toBeNull();
    expect(countryForIp("255.255.255.255")).toBeNull();
  });
  it("returns null for malformed input rather than throwing", () => {
    expect(countryForIp("not-an-ip")).toBeNull();
  });
  it("is consistent across repeated lookups (table cached)", () => {
    const a = countryForIp("8.8.8.8");
    const b = countryForIp("8.8.8.8");
    expect(a).toBe(b);
  });
  it("returns a plausible ISO-3166 alpha-2 code for sampled addresses", () => {
    for (const ip of ["13.107.42.14", "151.101.1.140", "142.250.190.78"]) {
      const cc = countryForIp(ip);
      if (cc !== null) expect(cc).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe("resolveDatacenterCountry precedence", () => {
  it("curated overrides beat IP geolocation", async () => {
    // github.com is CDN-fronted: DNS hands the scanner its nearest edge,
    // so IP lookup varies by scanner location. The curated entry pins it.
    const { country, source } = await resolveDatacenterCountry("github.com");
    expect(country).toBe("US");
    expect(source).toBe("known");
  });
  it("falls back to ccTLD when the domain does not resolve", async () => {
    const { country, source } = await resolveDatacenterCountry(
      "no-such-host-9f3a2b.fr",
    );
    expect(country).toBe("FR");
    expect(source).toBe("tld");
  });
  it("returns null when nothing is known (caller uses global average)", async () => {
    const { country, source } = await resolveDatacenterCountry(
      "no-such-host-9f3a2b.com",
    );
    expect(country).toBeNull();
    expect(source).toBeNull();
  });
});
