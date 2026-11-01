import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isClosingComplete, isLastReviewDateValid, isNextReviewDateValid } from "@wizard/closing";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isLastReviewDateValid", () => {
  it("accepts yesterday", () => {
    expect(isLastReviewDateValid("2026-10-16")).toBe(true);
  });

  it("accepts today", () => {
    expect(isLastReviewDateValid("2026-10-17")).toBe(true);
  });

  it("rejects tomorrow (future)", () => {
    expect(isLastReviewDateValid("2026-10-18")).toBe(false);
  });
});

describe("isNextReviewDateValid", () => {
  it("accepts tomorrow", () => {
    expect(isNextReviewDateValid("2026-10-18")).toBe(true);
  });

  it("rejects today", () => {
    expect(isNextReviewDateValid("2026-10-17")).toBe(false);
  });

  it("rejects yesterday (past)", () => {
    expect(isNextReviewDateValid("2026-10-16")).toBe(false);
  });
});

describe("isClosingComplete", () => {
  it("is false when either date is missing", () => {
    expect(isClosingComplete({ lastReviewDate: "2026-10-16" })).toBe(false);
    expect(isClosingComplete({ nextReviewDate: "2026-10-18" })).toBe(false);
  });

  it("is true when both dates are present and valid", () => {
    expect(isClosingComplete({ lastReviewDate: "2026-10-16", nextReviewDate: "2026-10-18" })).toBe(true);
  });

  it("is false when a date violates its rule", () => {
    expect(isClosingComplete({ lastReviewDate: "2026-10-18", nextReviewDate: "2026-10-19" })).toBe(false);
  });
});
