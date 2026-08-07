import { describe, expect, it } from "vitest";
import {
  countryForDomain,
  gridIntensityForDomain,
} from "@/grid/country-from-domain";
import { intensityFor } from "@/grid/intensity";

describe("countryForDomain", () => {
  it("maps ccTLDs to their own country", () => {
    expect(countryForDomain("lemonde.fr")).toBe("FR");
    expect(countryForDomain("spiegel.de")).toBe("DE");
    expect(countryForDomain("admin.ch")).toBe("CH");
    expect(countryForDomain("gov.za")).toBe("ZA");
    expect(countryForDomain("seznam.cz")).toBe("CZ");
  });
  it("maps .uk to GB", () => {
    expect(countryForDomain("bbc.co.uk")).toBe("GB");
  });
  it("maps generic TLDs to null", () => {
    expect(countryForDomain("example.com")).toBeNull();
    expect(countryForDomain("example.org")).toBeNull();
  });
  it("knows wikipedia.org is US", () => {
    expect(countryForDomain("wikipedia.org")).toBe("US");
  });
  it("knows github.com is US", () => {
    expect(countryForDomain("github.com")).toBe("US");
  });
});

describe("gridIntensityForDomain", () => {
  it("France is low-carbon (nuclear-heavy)", () => {
    expect(gridIntensityForDomain("lemonde.fr")).toBeLessThan(120);
  });
  it("Poland is coal-heavy", () => {
    expect(gridIntensityForDomain("onet.pl")).toBeGreaterThan(400);
  });
  it("Switzerland gets its own grid, not a neighbor's", () => {
    expect(gridIntensityForDomain("admin.ch")).toBeLessThan(100);
  });
  it("Unknown TLD returns the global average", () => {
    expect(gridIntensityForDomain("foo.com")).toBe(intensityFor(null));
  });
  it("ccTLD without grid data falls back to global", () => {
    expect(gridIntensityForDomain("example.io")).toBe(intensityFor(null));
  });
  it("Sweden is low-carbon", () => {
    expect(gridIntensityForDomain("svt.se")).toBeLessThan(100);
  });
});
