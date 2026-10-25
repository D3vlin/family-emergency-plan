import { afterEach, describe, expect, it, vi } from "vitest";
import { safeGet, safeSet } from "@utils/safeStorage";

describe("safeGet", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the stored value when localStorage works normally", () => {
    localStorage.setItem("plan", "content");
    expect(safeGet("plan")).toBe("content");
  });

  it("returns null instead of throwing when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(() => safeGet("plan")).not.toThrow();
    expect(safeGet("plan")).toBeNull();
  });
});

describe("safeSet", () => {
  afterEach(() => vi.restoreAllMocks());

  it("stores the value when localStorage works normally", () => {
    safeSet("plan", "content");
    expect(localStorage.getItem("plan")).toBe("content");
  });

  it("does not throw when localStorage.setItem throws (quota exceeded, disabled, private mode)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("exceeded the quota", "QuotaExceededError");
    });
    expect(() => safeSet("plan", "content")).not.toThrow();
  });
});
