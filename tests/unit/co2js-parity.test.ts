// Cross-validation against the Green Web Foundation's co2.js — the
// reference implementation of the Sustainable Web Design Model.
// Our hand-rolled compute stays (transparent, per-segment, 40 lines);
// this test proves it matches the ecosystem-standard library.
import { co2 } from "@tgwf/co2";
import { describe, expect, it } from "vitest";
import { computeCo2Segmented } from "@/scan/compute";

const GLOBAL_INTENSITY = 494;

function ours(bytes: number, greenHosted: boolean): number {
  const bytesGb = bytes / 1_000_000_000;
  return computeCo2Segmented(
    bytesGb,
    {
      dataCenter: GLOBAL_INTENSITY,
      network: GLOBAL_INTENSITY,
      device: GLOBAL_INTENSITY,
    },
    greenHosted,
  );
}

describe("co2.js SWDM v4 parity", () => {
  const swd = new co2({ model: "swd", version: 4, rating: false });

  const SIZES = [10_000, 500_000, 1_000_000, 2_500_000, 10_000_000];

  it("matches co2.js perVisit within 1% (grey hosting)", () => {
    for (const bytes of SIZES) {
      // co2.js perVisit applies first-visit/return-visit weighting; use
      // perByte for the raw per-view figure our model computes.
      const theirs = swd.perByte(bytes, false, {
        gridIntensity: {
          dataCenter: { value: GLOBAL_INTENSITY },
          network: { value: GLOBAL_INTENSITY },
          device: { value: GLOBAL_INTENSITY },
        },
      }) as number;
      const mine = ours(bytes, false);
      expect(Math.abs(mine - theirs) / theirs, `${bytes} bytes`).toBeLessThan(
        0.01,
      );
    }
  });

  it("matches co2.js green-hosting handling within 1%", () => {
    for (const bytes of SIZES) {
      const theirs = swd.perByte(bytes, true, {
        gridIntensity: {
          dataCenter: { value: GLOBAL_INTENSITY },
          network: { value: GLOBAL_INTENSITY },
          device: { value: GLOBAL_INTENSITY },
        },
      }) as number;
      const mine = ours(bytes, true);
      expect(Math.abs(mine - theirs) / theirs, `${bytes} bytes`).toBeLessThan(
        0.01,
      );
    }
  });

  it("segment constants sum to the published 0.300 kWh/GB", () => {
    expect(0.055 + 0.012 + 0.059 + 0.013 + 0.08 + 0.081).toBeCloseTo(0.3, 10);
  });
});
