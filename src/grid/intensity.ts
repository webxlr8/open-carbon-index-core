import fs from "node:fs";
import { dataPath } from "../paths";

let cache: ReadonlyMap<string, number> | null = null;

function load(): ReadonlyMap<string, number> {
  if (cache) return cache;
  const file = dataPath("grid-intensity.csv");
  const text = fs.readFileSync(file, "utf8");
  const map = new Map<string, number>();
  for (const line of text.split("\n").slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [iso2, , g] = trimmed.split(",");
    if (iso2 && g) map.set(iso2.toUpperCase(), Number(g));
  }
  cache = map;
  return map;
}

export function intensityFor(countryIso2: string | null | undefined): number {
  const m = load();
  if (!countryIso2) return m.get("GLOBAL") ?? 494;
  return m.get(countryIso2.toUpperCase()) ?? m.get("GLOBAL") ?? 494;
}

export type { GridCategory } from "./category";
export { gridIntensityCategory } from "./category";
