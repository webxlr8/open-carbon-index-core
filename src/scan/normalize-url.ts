// URL normalization + SSRF guarding for scan submissions.
// The worker will fetch whatever URL gets enqueued with a real headless
// browser, so in production anything that could point inside the network
// must be rejected before it reaches the queue.

export type NormalizeResult =
  | { ok: true; url: string; domain: string }
  | { ok: false; error: string };

// Matches a domain with optional path, query, and fragment.
const DOMAIN_RE =
  /^(localhost(:\d+)?|[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+)(:\d+)?([/?#].*)?$/i;

export interface NormalizeOptions {
  /** Permit localhost / private IPs — development only. */
  allowPrivate?: boolean;
}

export function normalizeUrl(
  input: string,
  opts: NormalizeOptions = {},
): NormalizeResult {
  const allowPrivate = opts.allowPrivate ?? false;
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Please enter a URL." };

  // If user already supplied a protocol, validate it.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const domain = u.hostname.replace(/^www\./, "");
      if (!allowPrivate && isBlockedHostname(u.hostname)) {
        return { ok: false, error: "That address can't be scanned." };
      }
      return { ok: true, url: u.toString(), domain };
    } catch {
      return { ok: false, error: "That doesn't look like a valid URL." };
    }
  }

  if (/\s/.test(trimmed))
    return { ok: false, error: "URLs can't contain spaces." };

  // Localhost shortcut for development.
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
    if (!allowPrivate) {
      return { ok: false, error: "That address can't be scanned." };
    }
    return { ok: true, url: `http://${trimmed}`, domain: "localhost" };
  }

  // IP address (v4)
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(trimmed)) {
    const [beforeSlash] = trimmed.split("/");
    const hostPart = (beforeSlash ?? "0.0.0.0").split(":")[0] ?? "0.0.0.0";
    if (!allowPrivate && isPrivateIp(hostPart)) {
      return { ok: false, error: "That address can't be scanned." };
    }
    return { ok: true, url: `http://${trimmed}`, domain: hostPart };
  }

  // Domain with optional path/query/fragment.
  if (DOMAIN_RE.test(trimmed)) {
    const [beforePath] = trimmed.split(/[/?#]/);
    const [hostPart] = (beforePath ?? trimmed).split(":");
    const host = hostPart ?? trimmed;
    if (!allowPrivate && isBlockedHostname(host)) {
      return { ok: false, error: "That address can't be scanned." };
    }
    const domain = host.replace(/^www\./, "");
    return { ok: true, url: `https://${trimmed}`, domain };
  }

  return {
    ok: false,
    error: "That doesn't look like a valid domain (e.g. example.com).",
  };
}

// Hostnames that must never be scanned in production.
export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".lan"))
    return true;
  // IP literals hiding in hostname position
  if (/^\[?[0-9a-f:]+\]?$/i.test(h) && h.includes(":")) return true; // IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return isPrivateIp(h);
  return false;
}

// Private / loopback / link-local / metadata ranges for IPv4 and IPv6.
export function isPrivateIp(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, "").toLowerCase();

  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  const mapped = bare.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped?.[1]) return isPrivateIpv4(mapped[1]);

  if (bare.includes(":")) {
    // IPv6: loopback, unspecified, ULA fc00::/7, link-local fe80::/10
    if (bare === "::1" || bare === "::") return true;
    if (bare.startsWith("fc") || bare.startsWith("fd")) return true;
    if (/^fe[89ab]/.test(bare)) return true;
    return false;
  }

  return isPrivateIpv4(bare);
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p > 255)) {
    return true; // malformed → treat as unsafe
  }
  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a >= 224) return true; // multicast + reserved
  return false;
}
