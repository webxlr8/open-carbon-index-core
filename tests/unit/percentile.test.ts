import { describe, expect, it } from "vitest";
import { percentileRank, referencePercentile } from "@/scan/percentile";

describe("referencePercentile", () => {
  it("grade thresholds land on their published percentiles", () => {
    expect(referencePercentile(0.04)).toBe(95);
    expect(referencePercentile(0.079)).toBe(90);
    expect(referencePercentile(0.145)).toBe(80);
    expect(referencePercentile(0.359)).toBe(50);
  });
  it("interpolates between anchors", () => {
    const mid = referencePercentile(0.112); // between 0.079 (90) and 0.145 (80)
    expect(mid).toBeLessThan(90);
    expect(mid).toBeGreaterThan(80);
  });
  it("clamps at the extremes", () => {
    expect(referencePercentile(0)).toBe(100);
    expect(referencePercentile(50)).toBe(0);
  });
  it("a ~2.5MB page (≈0.36g at global grid) sits near the median", () => {
    const co2 = (2_500_000 / 1_000_000_000) * 0.3 * 473;
    const p = referencePercentile(co2);
    expect(p).toBeGreaterThan(40);
    expect(p).toBeLessThanOrEqual(55);
  });
});

describe("percentileRank", () => {
  it("100 when better than entire sample", () => {
    const sample = [0.1, 0.2, 0.3, 0.4, 0.5];
    expect(percentileRank(0.05, sample)).toBe(100);
  });
  it("0 when worse than entire sample", () => {
    expect(percentileRank(0.9, [0.1, 0.2, 0.3])).toBe(0);
  });
  it("mid when at median", () => {
    const sample = [0.1, 0.2, 0.3, 0.4, 0.5];
    expect(percentileRank(0.3, sample)).toBeGreaterThanOrEqual(40);
    expect(percentileRank(0.3, sample)).toBeLessThan(60);
  });
});
