export type Grade = "A+" | "A" | "B" | "C" | "D" | "E" | "F";

const THRESHOLDS: ReadonlyArray<readonly [Grade, number]> = [
  ["A+", 0.04],
  ["A", 0.079],
  ["B", 0.145],
  ["C", 0.209],
  ["D", 0.278],
  ["E", 0.359],
] as const;

export function gradeFor(co2Grams: number): Grade {
  for (const [grade, max] of THRESHOLDS) {
    if (co2Grams <= max) return grade;
  }
  return "F";
}
