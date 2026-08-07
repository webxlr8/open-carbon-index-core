import { describe, expect, it } from "vitest";
import {
  isBlockedHostname,
  isPrivateIp,
  normalizeUrl,
} from "@/scan/normalize-url";

// Dev mode: private targets allowed (localhost scanning is a dev feature).
const dev = { allowPrivate: true };

describe("normalizeUrl (dev mode)", () => {
  it("accepts bare domain", () => {
    const r = normalizeUrl("example.com", dev);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toBe("https://example.com");
      expect(r.domain).toBe("example.com");
    }
  });
  it("accepts www-prefixed domain", () => {
    const r = normalizeUrl("www.example.com", dev);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toBe("https://www.example.com");
      expect(r.domain).toBe("example.com");
    }
  });
  it("accepts domain with path", () => {
    const r = normalizeUrl("example.com/some/page", dev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe("https://example.com/some/page");
  });
  it("accepts domain with query string", () => {
    const r = normalizeUrl("example.com?utm_source=test", dev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe("https://example.com?utm_source=test");
  });
  it("accepts https URL as-is", () => {
    const r = normalizeUrl("https://example.com", dev);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toBe("https://example.com/");
      expect(r.domain).toBe("example.com");
    }
  });
  it("accepts http URL as-is", () => {
    const r = normalizeUrl("http://example.com", dev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe("http://example.com/");
  });
  it("accepts localhost:port", () => {
    const r = normalizeUrl("localhost:3000", dev);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toBe("http://localhost:3000");
      expect(r.domain).toBe("localhost");
    }
  });
  it("accepts IP address", () => {
    const r = normalizeUrl("192.168.1.1", dev);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toBe("http://192.168.1.1");
      expect(r.domain).toBe("192.168.1.1");
    }
  });
  it("accepts subdomain", () => {
    const r = normalizeUrl("blog.example.com", dev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain).toBe("blog.example.com");
  });
  it("rejects empty string", () => {
    expect(normalizeUrl("", dev).ok).toBe(false);
  });
  it("rejects whitespace-only", () => {
    expect(normalizeUrl("   ", dev).ok).toBe(false);
  });
  it("rejects input with spaces", () => {
    expect(normalizeUrl("example .com", dev).ok).toBe(false);
  });
  it("rejects invalid input", () => {
    expect(normalizeUrl("not a url", dev).ok).toBe(false);
  });
  it("rejects just .tld", () => {
    expect(normalizeUrl(".com", dev).ok).toBe(false);
  });
  it("trims whitespace", () => {
    const r = normalizeUrl("  example.com  ", dev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain).toBe("example.com");
  });
  it("rejects ftp:// and other protocols", () => {
    expect(normalizeUrl("ftp://example.com", dev).ok).toBe(false);
  });
});

describe("normalizeUrl SSRF guard (production mode)", () => {
  it("rejects localhost", () => {
    expect(normalizeUrl("localhost:3000").ok).toBe(false);
    expect(normalizeUrl("http://localhost:8080").ok).toBe(false);
    expect(normalizeUrl("sub.localhost").ok).toBe(false);
  });
  it("rejects private IPv4 ranges", () => {
    for (const ip of [
      "10.0.0.1",
      "172.16.0.1",
      "192.168.1.1",
      "127.0.0.1",
      "169.254.169.254",
      "0.0.0.0",
    ]) {
      expect(normalizeUrl(ip).ok, ip).toBe(false);
      expect(normalizeUrl(`http://${ip}/`).ok, ip).toBe(false);
    }
  });
  it("allows public IPv4", () => {
    expect(normalizeUrl("8.8.8.8").ok).toBe(true);
  });
  it("rejects internal-looking hostnames", () => {
    expect(normalizeUrl("db.internal").ok).toBe(false);
    expect(normalizeUrl("printer.local").ok).toBe(false);
    expect(normalizeUrl("nas.lan").ok).toBe(false);
  });
  it("allows normal public domains", () => {
    expect(normalizeUrl("example.com").ok).toBe(true);
    expect(normalizeUrl("https://www.example.com/page").ok).toBe(true);
  });
});

describe("isPrivateIp", () => {
  it("classifies IPv4", () => {
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("172.32.0.1")).toBe(false);
    expect(isPrivateIp("93.184.216.34")).toBe(false);
    expect(isPrivateIp("224.0.0.1")).toBe(true);
  });
  it("classifies IPv6", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fd12:3456::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("2606:2800:220:1::1")).toBe(false);
  });
  it("handles IPv4-mapped IPv6", () => {
    expect(isPrivateIp("::ffff:192.168.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
  });
  it("treats malformed input as unsafe", () => {
    expect(isPrivateIp("999.1.1.1")).toBe(true);
  });
});

describe("isBlockedHostname", () => {
  it("blocks internal suffixes and IPv6 literals", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("app.internal")).toBe(true);
    expect(isBlockedHostname("[::1]")).toBe(true);
    expect(isBlockedHostname("example.com")).toBe(false);
  });
});
