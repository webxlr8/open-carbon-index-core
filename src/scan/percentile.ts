import fs from "node:fs";
import { dataPath } from "../paths";

// "Cleaner than X%" is computed against a fixed public reference
// distribution (see data/reference-distribution.json for provenance), not
// against our own scan history — a self-referential percentile is
// meaningless while the index is small and drifts as it grows. Computed at
// read time, so updating the reference file refreshes every page and badge
// without touching stored rows.

interface Anchor {
  co2: number;
  cleanerThan: number;
}

let anchors: Anchor[] | null = null;

function loadAnchors(): Anchor[] {
  if (anchors) return anchors;
  const file = dataPath("reference-distribution.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as {
    anchors: Anchor[];
  };
  anchors = [...parsed.anchors].sort((a, b) => a.co2 - b.co2);
  return anchors;
}

/** Percentile of the web cleaner than `co2` grams/view (0–100, higher = cleaner). */
export function referencePercentile(co2: number): number {
  const list = loadAnchors();
  const first = list[0];
  const last = list[list.length - 1];
  if (!first || !last) return 50;
  if (co2 <= first.co2) return first.cleanerThan;
  if (co2 >= last.co2) return last.cleanerThan;
  for (let i = 1; i < list.length; i++) {
    const lo = list[i - 1];
    const hi = list[i];
    if (!lo || !hi) break;
    if (co2 <= hi.co2) {
      const t = (co2 - lo.co2) / (hi.co2 - lo.co2);
      return Math.round(lo.cleanerThan + t * (hi.cleanerThan - lo.cleanerThan));
    }
  }
  return last.cleanerThan;
}

// Rank within an arbitrary sample — kept for blending our own corpus into
// the reference once it's large enough to be meaningful (>10k domains).
export function percentileRank(
  co2: number,
  sample: ReadonlyArray<number>,
): number {
  if (sample.length === 0) return 50;
  const sorted = [...sample].sort((a, b) => a - b);
  let countCleaner = 0;
  for (const v of sorted) if (v > co2) countCleaner++;
  return Math.round((countCleaner / sorted.length) * 100);
}
