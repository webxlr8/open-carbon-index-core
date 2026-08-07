import { describe, expect, it } from "vitest";
import { categorize } from "@/scan/third-parties";

describe("categorize", () => {
  it("detects Google Analytics", () => {
    expect(categorize("www.google-analytics.com")).toBe("analytics");
  });
  it("detects Segment", () => {
    expect(categorize("cdn.segment.com")).toBe("analytics");
  });
  it("detects Facebook Pixel", () => {
    expect(categorize("connect.facebook.net")).toBe("social");
  });
  it("detects Cloudflare CDN", () => {
    expect(categorize("cdnjs.cloudflare.com")).toBe("cdn");
  });
  it("detects Google Fonts", () => {
    expect(categorize("fonts.gstatic.com")).toBe("font");
  });
  it("returns other for unknown", () => {
    expect(categorize("random.example.com")).toBe("other");
  });
});
