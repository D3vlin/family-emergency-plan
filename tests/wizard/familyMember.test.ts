import { describe, expect, it } from "vitest";
import {
  createEmptyMember,
  isAgeValid,
  isDisabilitySectionValid,
  isDuplicateIdentity,
  isDuplicateSite,
  isMemberComplete,
  isPhoneFormatValid,
  normalizeMember,
  UNDER_ONE_YEAR,
} from "@wizard/familyMember";

describe("isMemberComplete", () => {
  it("requires name, document type, document number and age", () => {
    const member = {
      ...createEmptyMember("1"),
      name: "Ana",
      documentType: "Cédula de Ciudadanía",
      documentNumber: "123",
      age: "30",
    };
    expect(isMemberComplete(member)).toBe(true);
  });

  it("is incomplete without a document type even if the number is present", () => {
    const member = { ...createEmptyMember("1"), name: "Ana", documentNumber: "123", age: "30" };
    expect(isMemberComplete(member)).toBe(false);
  });

  it("is incomplete without an age, even with every other required field filled", () => {
    const member = { ...createEmptyMember("1"), name: "Ana", documentType: "Cédula de Ciudadanía", documentNumber: "123" };
    expect(isMemberComplete(member)).toBe(false);
  });
});

describe("isPhoneFormatValid", () => {
  it.each([
    ["300 123 4567", true],
    ["+57 300-1234567", true],
    ["abc1234", false],
    ["", false],
  ])("%s -> %s", (value, expected) => {
    expect(isPhoneFormatValid(value)).toBe(expected);
  });
});

describe("isAgeValid", () => {
  it("rejects an empty age", () => {
    expect(isAgeValid("")).toBe(false);
  });

  it("accepts the special under-one-year value", () => {
    expect(isAgeValid(UNDER_ONE_YEAR)).toBe(true);
  });

  it.each([
    ["1", true],
    ["120", true],
    ["0", false],
    ["121", false],
  ])("age %s -> %s", (value, expected) => {
    expect(isAgeValid(value)).toBe(expected);
  });
});

describe("isDuplicateIdentity (normalized comparison)", () => {
  const existing = {
    ...createEmptyMember("1"),
    documentType: "Cédula de Ciudadanía",
    documentNumber: "123",
  };

  it("flags the same type+number, even with different spacing/case", () => {
    const candidate = {
      ...createEmptyMember("2"),
      documentType: "cédula de ciudadanía",
      documentNumber: "1 2 3",
    };
    expect(isDuplicateIdentity([existing], candidate)).toBe(true);
  });

  it("does not flag the same number with a different document type", () => {
    const candidate = {
      ...createEmptyMember("2"),
      documentType: "Registro Civil",
      documentNumber: "123",
    };
    expect(isDuplicateIdentity([existing], candidate)).toBe(false);
  });

  it("never flags a member against itself", () => {
    expect(isDuplicateIdentity([existing], existing)).toBe(false);
  });
});

describe("isDisabilitySectionValid", () => {
  it("is valid with no disabilities at all", () => {
    expect(isDisabilitySectionValid(createEmptyMember("1"))).toBe(true);
  });

  it("requires life-support to be answered once a disability is listed", () => {
    const member = { ...createEmptyMember("1"), disabilities: [{ id: "d1", type: "Visual" }] };
    expect(isDisabilitySectionValid(member)).toBe(false);
    expect(isDisabilitySectionValid({ ...member, requiresLifeSupport: "No requiere" })).toBe(true);
  });
});

describe("isDuplicateSite (normalized)", () => {
  it("flags the same site with different case/spacing for the same member", () => {
    const member = {
      ...createEmptyMember("1"),
      frequentSites: [{ id: "s1", site: "Parque Central", contactPerson: "", contactPhone: "" }],
    };
    const candidate = { id: "s2", site: "parque   central", contactPerson: "", contactPhone: "" };
    expect(isDuplicateSite(member, candidate)).toBe(true);
  });

  it("does not flag a genuinely different site", () => {
    const member = {
      ...createEmptyMember("1"),
      frequentSites: [{ id: "s1", site: "Parque Central", contactPerson: "", contactPhone: "" }],
    };
    const candidate = { id: "s2", site: "Colegio", contactPerson: "", contactPhone: "" };
    expect(isDuplicateSite(member, candidate)).toBe(false);
  });
});

describe("normalizeMember (schema backfill)", () => {
  it("fills in fields missing from a record saved under an older shape", () => {
    const stale = { id: "1", name: "Ana", documentType: "Cédula de Ciudadanía", documentNumber: "1" };
    const normalized = normalizeMember(stale as never);
    expect(normalized.frequentSites).toEqual([]);
    expect(normalized.disabilities).toEqual([]);
    expect(normalized.name).toBe("Ana");
  });

  it("keeps existing values when the record already has them", () => {
    const member = { ...createEmptyMember("1"), frequentSites: [{ id: "s1", site: "Casa", contactPerson: "", contactPhone: "" }] };
    expect(normalizeMember(member).frequentSites).toHaveLength(1);
  });
});
