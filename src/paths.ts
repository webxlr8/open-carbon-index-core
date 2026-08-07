import path from "node:path";
import { fileURLToPath } from "node:url";

// Bundled data and font files are resolved relative to THIS module, not to
// the consuming application's working directory. Using process.cwd() works
// inside the app that owns the files and breaks silently the moment this
// package is installed as a dependency — the lookup would land in the
// consumer's project root instead.
//
// OCI_DATA_DIR / OCI_ASSET_DIR override both, so a host can ship its own
// refreshed datasets without republishing the package.

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Absolute path to a bundled dataset, e.g. dataPath("grid-intensity.csv"). */
export function dataPath(file: string): string {
  const base = process.env.OCI_DATA_DIR ?? path.join(packageRoot, "data");
  return path.join(base, file);
}

/** Absolute path to a bundled asset, e.g. assetPath("fonts", "Inter-Bold.ttf"). */
export function assetPath(...parts: string[]): string {
  const base = process.env.OCI_ASSET_DIR ?? path.join(packageRoot, "assets");
  return path.join(base, ...parts);
}
