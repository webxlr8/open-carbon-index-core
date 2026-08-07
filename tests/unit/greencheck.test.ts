import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearGreenCache, isGreenHosted } from "@/scan/greencheck";

const OPTS = { apiUrl: "https://greencheck.test/api" };

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  clearGreenCache();
});

describe("isGreenHosted", () => {
  it("returns true when API confirms green", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ green: true }),
    });
    const r = await isGreenHosted("example.com", OPTS);
    expect(r).toBe(true);
  });
  it("returns false when API says not green", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ green: false }),
    });
    expect(await isGreenHosted("example.com", OPTS)).toBe(false);
  });
  it("returns false on API error (fail open to not-green)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down"));
    expect(await isGreenHosted("example.com", OPTS)).toBe(false);
  });
});
