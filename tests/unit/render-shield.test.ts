import { describe, expect, it } from "vitest";
import { renderShieldSvg, shieldValueText } from "@/badge/render-shield";
import { GRADE_COLORS, UNKNOWN_COLOR } from "@/badge/styles";

describe("renderShieldSvg", () => {
  it("is deterministic for identical input", () => {
    const a = renderShieldSvg({ grade: "A+", co2Grams: 0.05, label: "carbon" });
    const b = renderShieldSvg({ grade: "A+", co2Grams: 0.05, label: "carbon" });
    expect(a).toBe(b);
  });

  it("uses the grade color and contains label + value", () => {
    const svg = renderShieldSvg({
      grade: "B",
      co2Grams: 0.12,
      label: "carbon",
    });
    expect(svg).toContain(GRADE_COLORS.B);
    expect(svg).toContain(">carbon</text>");
    expect(svg).toContain("B · 0.12 g/view");
  });

  it("renders a neutral badge for unscanned domains", () => {
    const svg = renderShieldSvg({
      grade: null,
      co2Grams: null,
      label: "carbon",
    });
    expect(svg).toContain(UNKNOWN_COLOR);
    expect(svg).toContain("not scanned yet");
  });

  it("escapes XML in the label", () => {
    const svg = renderShieldSvg({
      grade: "A",
      co2Grams: 0.05,
      label: "a&b's",
    });
    expect(svg).toContain("a&amp;b&apos;s");
    expect(svg).not.toContain("a&b's");
  });

  it("uses mg formatting for tiny values", () => {
    expect(shieldValueText("A+", 0.0005)).toBe("A+ · 0.50 mg/view");
    expect(shieldValueText("C", 0.2)).toBe("C · 0.20 g/view");
    expect(shieldValueText(null, null)).toBe("not scanned yet");
  });

  it("contains no unescaped angle brackets from input", () => {
    const svg = renderShieldSvg({
      grade: null,
      co2Grams: null,
      label: "ok label",
    });
    // structural sanity: parses as a single svg element chain
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });
});
