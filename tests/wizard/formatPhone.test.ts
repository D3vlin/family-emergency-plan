import { describe, expect, it } from "vitest";
import { formatPhoneForDisplay } from "@wizard/formatPhone";

describe("formatPhoneForDisplay", () => {
  it("groups a plain 10-digit number as 3-3-4", () => {
    expect(formatPhoneForDisplay("3001234567")).toBe("300 123 4567");
  });

  it("is idempotent for an already-grouped number", () => {
    expect(formatPhoneForDisplay("300 123 4567")).toBe("300 123 4567");
  });

  it("re-groups a number typed with hyphens", () => {
    expect(formatPhoneForDisplay("300-123-4567")).toBe("300 123 4567");
  });

  it("leaves a short fixed number (e.g. the emergency line) unchanged", () => {
    expect(formatPhoneForDisplay("123")).toBe("123");
  });

  it("leaves a number with a country code unchanged, just collapsing whitespace", () => {
    expect(formatPhoneForDisplay("+57  300 1234567")).toBe("+57 300 1234567");
  });

  it("trims surrounding whitespace", () => {
    expect(formatPhoneForDisplay("  3001234567  ")).toBe("300 123 4567");
  });
});
