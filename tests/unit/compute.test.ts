import { describe, expect, it } from "vitest";
import { computeCo2Segmented, SEGMENT_KWH_PER_GB } from "@/scan/compute";

const SAME_SEGMENTS = { dataCenter: 494, network: 494, device: 494 };

describe("computeCo2Segmented", () => {
  it("uses SWDM v4 constants: 0.300 kWh/GB × 494 gCO2/kWh", () => {
    const expected = 1 * 0.3 * 494;
    expect(computeCo2Segmented(1, SAME_SEGMENTS)).toBeCloseTo(expected, 6);
  });
  it("scales linearly with bytes", () => {
    expect(computeCo2Segmented(2, SAME_SEGMENTS)).toBeCloseTo(
      computeCo2Segmented(1, SAME_SEGMENTS) * 2,
      6,
    );
  });
  it("applies green hosting zero-out of datacenter operational", () => {
    const base = computeCo2Segmented(1, SAME_SEGMENTS, false);
    const green = computeCo2Segmented(1, SAME_SEGMENTS, true);
    // Saves DC_OPERATIONAL (0.055) kWh/GB × 494 gCO2/kWh = 27.17 g per GB
    expect(base - green).toBeCloseTo(0.055 * 494, 1);
  });
  it("scales with grid intensity", () => {
    const double = { dataCenter: 988, network: 988, device: 988 };
    expect(computeCo2Segmented(1, double)).toBeCloseTo(
      computeCo2Segmented(1, SAME_SEGMENTS) * 2,
      6,
    );
  });
  it("applies segment-specific intensities correctly", () => {
    // Different grid intensity per segment
    const mixed = computeCo2Segmented(1, {
      dataCenter: 100,
      network: 494,
      device: 700,
    });
    // dc: 0.067*100=6.7, net:0.072*494=35.568, dev:0.161*700=112.7 → total=154.968
    const expected =
      (SEGMENT_KWH_PER_GB.dc_operational + SEGMENT_KWH_PER_GB.dc_embodied) *
        100 +
      (SEGMENT_KWH_PER_GB.net_operational + SEGMENT_KWH_PER_GB.net_embodied) *
        494 +
      (SEGMENT_KWH_PER_GB.dev_operational + SEGMENT_KWH_PER_GB.dev_embodied) *
        700;
    expect(mixed).toBeCloseTo(expected, 6);
  });
  it("zeroes dc_operational when green hosted, keeps embodied", () => {
    const green = computeCo2Segmented(1, SAME_SEGMENTS, true);
    // dc: (0.012 only, not 0.055) * 494 = 5.928
    // net: (0.059+0.013) * 494 = 35.568
    // dev: (0.080+0.081) * 494 = 79.534
    // total = 120.93... ≈ 121.03
    const expectedDc = SEGMENT_KWH_PER_GB.dc_embodied * 494;
    const expectedNet =
      (SEGMENT_KWH_PER_GB.net_operational + SEGMENT_KWH_PER_GB.net_embodied) *
      494;
    const expectedDev =
      (SEGMENT_KWH_PER_GB.dev_operational + SEGMENT_KWH_PER_GB.dev_embodied) *
      494;
    expect(green).toBeCloseTo(expectedDc + expectedNet + expectedDev, 6);
  });
});
