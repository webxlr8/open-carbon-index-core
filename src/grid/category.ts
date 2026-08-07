export type GridCategory =
  | "Renewable"
  | "Mixed"
  | "Conventional"
  | "Fossil-heavy";

export function gridIntensityCategory(intensity: number): GridCategory {
  if (intensity < 100) return "Renewable";
  if (intensity < 300) return "Mixed";
  if (intensity < 500) return "Conventional";
  return "Fossil-heavy";
}
