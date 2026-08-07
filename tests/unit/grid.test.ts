import { describe, expect, it } from "vitest";
import { intensityFor } from "@/grid/intensity";

describe("intensityFor", () => {
  it("returns the GLOBAL row when country unknown", () => {
    expect(intensityFor("ZZ")).toBe(intensityFor(null));
    expect(intensityFor(null)).toBeGreaterThan(300);
    expect(intensityFor(null)).toBeLessThan(600);
  });
  it("returns country value for FR (nuclear-heavy, low carbon)", () => {
    expect(intensityFor("FR")).toBeLessThan(120);
  });
  it("covers the full Ember country list", () => {
    // A few countries the old 15-row snapshot lacked entirely
    expect(intensityFor("CH")).toBeLessThan(100); // Switzerland
    expect(intensityFor("ZA")).toBeGreaterThan(500); // South Africa (coal)
    expect(intensityFor("NP")).toBeGreaterThan(0); // Nepal
  });
});
