// Green Web Foundation greencheck.
//
// This module is part of the open measurement core, so it takes no
// dependency on the application's env or database: the API URL and the
// cache are injected. The app supplies a SQLite-backed cache
// (see greencheck-cache.ts); anyone using the core standalone gets a
// process-lifetime in-memory cache for free.

/** Success TTL — hosting arrangements change slowly. */
const OK_TTL_S = 30 * 24 * 60 * 60;
/** Error TTL — short, so a flaky API isn't re-hit on every scan. */
const ERROR_TTL_S = 60 * 60;
const FETCH_TIMEOUT_MS = 5_000;

export interface GreencheckRecord {
  green: boolean;
  /** false when the lookup itself failed — cached briefly, not for 30 days. */
  ok: boolean;
  /** Unix seconds. */
  checkedAt: number;
}

export interface GreencheckCache {
  get(domain: string): GreencheckRecord | undefined;
  set(domain: string, record: GreencheckRecord): void;
  clear(): void;
}

/** Default cache: per-process, lost on restart. The app overrides this. */
export function createMemoryCache(): GreencheckCache {
  const map = new Map<string, GreencheckRecord>();
  return {
    get: (d) => map.get(d),
    set: (d, r) => {
      map.set(d, r);
    },
    clear: () => map.clear(),
  };
}

const defaultCache = createMemoryCache();

export interface GreencheckOptions {
  /** Green Web Foundation greencheck endpoint. */
  apiUrl: string;
  cache?: GreencheckCache;
}

export async function isGreenHosted(
  domain: string,
  opts: GreencheckOptions,
): Promise<boolean> {
  const key = domain.toLowerCase().replace(/^www\./, "");
  const cache = opts.cache ?? defaultCache;

  const hit = cache.get(key);
  if (hit) {
    const age = Math.floor(Date.now() / 1000) - hit.checkedAt;
    if (age < (hit.ok ? OK_TTL_S : ERROR_TTL_S)) return hit.green;
  }

  let green = false;
  let ok = false;
  try {
    const res = await fetch(`${opts.apiUrl}/${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = (await res.json()) as { green?: boolean };
      green = data.green === true;
      ok = true;
    }
  } catch {
    // network error / timeout → fail-safe "not green", cached briefly
  }

  cache.set(key, { green, ok, checkedAt: Math.floor(Date.now() / 1000) });
  return green;
}

/** @internal Reset the default in-memory cache. Used by tests. */
export function clearGreenCache(): void {
  defaultCache.clear();
}
