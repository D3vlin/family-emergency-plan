import { describe, expect, it } from "vitest";
import { createEmptyContact, isDuplicatePhone } from "@wizard/contact";

describe("isDuplicatePhone (normalized)", () => {
  const existing = { ...createEmptyContact("1"), name: "Ana", phone: "300 123 4567" };

  it("flags the same phone written with different spacing", () => {
    const candidate = { ...createEmptyContact("2"), name: "Luis", phone: "3001234567" };
    expect(isDuplicatePhone([existing], candidate)).toBe(true);
  });

  it("does not flag a genuinely different phone", () => {
    const candidate = { ...createEmptyContact("2"), name: "Luis", phone: "300 999 9999" };
    expect(isDuplicatePhone([existing], candidate)).toBe(false);
  });
});
