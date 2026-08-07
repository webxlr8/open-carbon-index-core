import { describe, expect, it } from "vitest";
import { parseBadgeParams, styleKey } from "@/badge/params";

function params(q: string): URLSearchParams {
  return new URLSearchParams(q);
}

describe("parseBadgeParams", () => {
  it("returns defaults for empty params", () => {
    const s = parseBadgeParams(params(""));
    // theme defaults to "auto": an embedder shouldn't have to know or
    // maintain which colour scheme their page is in.
    expect(s).toEqual({
      variant: "card",
      theme: "auto",
      background: "solid",
      label: "carbon",
      showPercentile: true,
    });
  });

  it("parses valid params", () => {
    const s = parseBadgeParams(
      params("variant=shield&theme=dark&label=eco&percentile=0"),
    );
    expect(s.variant).toBe("shield");
    expect(s.theme).toBe("dark");
    expect(s.label).toBe("eco");
    expect(s.showPercentile).toBe(false);
  });

  it("falls back to defaults on garbage values", () => {
    const s = parseBadgeParams(
      params("variant=banana&theme=neon&percentile=yes"),
    );
    expect(s.variant).toBe("card");
    expect(s.theme).toBe("auto");
    expect(s.background).toBe("solid");
    expect(s.showPercentile).toBe(true);
  });

  it("rejects labels with markup or over-length", () => {
    expect(parseBadgeParams(params("label=<script>")).label).toBe("carbon");
    expect(parseBadgeParams(params(`label=${"x".repeat(21)}`)).label).toBe(
      "carbon",
    );
    expect(parseBadgeParams(params("label=my site")).label).toBe("my site");
  });

  it("parses theme=auto and a transparent background", () => {
    const s = parseBadgeParams(params("theme=auto&bg=transparent"));
    expect(s.theme).toBe("auto");
    expect(s.background).toBe("transparent");
  });

  it("styleKey separates every visual option, or ETags collide", () => {
    // Two badges that look different must never share a cache key.
    const keys = [
      "",
      "theme=light",
      "theme=dark",
      "bg=transparent",
      "variant=shield",
      "percentile=0",
    ].map((q) => styleKey(parseBadgeParams(params(q))));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("styleKey is unique per permutation and stable", () => {
    const a = styleKey(parseBadgeParams(params("")));
    const b = styleKey(parseBadgeParams(params("variant=shield")));
    const c = styleKey(parseBadgeParams(params("percentile=0")));
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).toBe(styleKey(parseBadgeParams(params(""))));
  });
});
