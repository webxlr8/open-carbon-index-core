import { describe, expect, it } from "vitest";
import { gradeFor } from "@/scan/grade";

describe("gradeFor", () => {
  it("A+ for very clean", () => {
    expect(gradeFor(0.03)).toBe("A+");
  });
  it("A at threshold", () => {
    expect(gradeFor(0.079)).toBe("A");
  });
  it("B mid", () => {
    expect(gradeFor(0.1)).toBe("B");
  });
  it("C median", () => {
    expect(gradeFor(0.18)).toBe("C");
  });
  it("D", () => {
    expect(gradeFor(0.24)).toBe("D");
  });
  it("E", () => {
    expect(gradeFor(0.32)).toBe("E");
  });
  it("F above threshold", () => {
    expect(gradeFor(0.5)).toBe("F");
  });
});
