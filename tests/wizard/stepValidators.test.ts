import { describe, expect, it } from "vitest";
import {
  computeFurthestAllowedStep,
  isStepValid,
  STEP_HEADER,
  STEP_FAMILY,
  STEP_CONTACTS,
  STEP_DISABILITIES,
} from "@wizard/stepValidators";
import { createEmptyMember } from "@wizard/familyMember";

describe("isStepValid", () => {
  it("step 1 (header) is valid with plan name and address filled", () => {
    expect(isStepValid(STEP_HEADER, { header: { planName: "Familia Perez", address: "Calle 1" } })).toBe(true);
  });

  it("step 1 is invalid with a missing required field", () => {
    expect(isStepValid(STEP_HEADER, { header: { planName: "", address: "Calle 1" } })).toBe(false);
    expect(isStepValid(STEP_HEADER, {})).toBe(false);
  });

  it("step 2 (familia) is invalid with no family members at all", () => {
    expect(isStepValid(STEP_FAMILY, {})).toBe(false);
    expect(isStepValid(STEP_FAMILY, { familyMembers: [] })).toBe(false);
  });

  it("step 2 is valid once every listed member is complete", () => {
    const member = { ...createEmptyMember("1"), name: "Ana", documentType: "Cédula de Ciudadanía", documentNumber: "123", age: "30" };
    expect(isStepValid(STEP_FAMILY, { familyMembers: [member] })).toBe(true);
  });

  it("step 3 (contactos) is valid even with an empty contact list", () => {
    expect(isStepValid(STEP_CONTACTS, {})).toBe(true);
    expect(isStepValid(STEP_CONTACTS, { contacts: [] })).toBe(true);
  });

  it("step 4 (discapacidades) is valid when marked as not applicable", () => {
    expect(isStepValid(STEP_DISABILITIES, { disabilitiesNotApplicable: true })).toBe(true);
  });

  it("step 4 is invalid with members but no disability data at all", () => {
    const member = { ...createEmptyMember("1"), name: "Ana" };
    expect(isStepValid(STEP_DISABILITIES, { familyMembers: [member] })).toBe(false);
  });

  it("step 4 is invalid once a member has a disability but no life-support answer", () => {
    const member = { ...createEmptyMember("1"), name: "Ana", disabilities: [{ id: "d1", type: "Visual" }] };
    expect(isStepValid(STEP_DISABILITIES, { familyMembers: [member] })).toBe(false);
  });

  it("step 4 is valid once every member with a disability has life-support resolved", () => {
    const member = {
      ...createEmptyMember("1"),
      name: "Ana",
      disabilities: [{ id: "d1", type: "Visual" }],
      requiresLifeSupport: "No requiere",
    };
    expect(isStepValid(STEP_DISABILITIES, { familyMembers: [member] })).toBe(true);
  });
});

describe("computeFurthestAllowedStep", () => {
  it("stays at step 1 when step 1 is invalid", () => {
    expect(computeFurthestAllowedStep({})).toBe(STEP_HEADER);
  });

  it("unlocks past step 1 once it's valid", () => {
    const data = { header: { planName: "Familia Perez", address: "Calle 1" } };
    expect(computeFurthestAllowedStep(data)).toBe(STEP_FAMILY);
  });

  it("stays at step 4 once steps 1-3 are valid but the disability section isn't resolved yet", () => {
    const member = { ...createEmptyMember("1"), name: "Ana", documentType: "Cédula de Ciudadanía", documentNumber: "123", age: "30" };
    const data = {
      header: { planName: "Familia Perez", address: "Calle 1" },
      familyMembers: [member],
    };
    expect(computeFurthestAllowedStep(data)).toBe(STEP_DISABILITIES);
  });

  it("unlocks past step 4 once the disability section is resolved too", () => {
    const member = {
      ...createEmptyMember("1"),
      name: "Ana",
      documentType: "Cédula de Ciudadanía",
      documentNumber: "123",
      age: "30",
    };
    const data = {
      header: { planName: "Familia Perez", address: "Calle 1" },
      familyMembers: [member],
      disabilitiesNotApplicable: true,
    };
    expect(computeFurthestAllowedStep(data)).toBe(STEP_DISABILITIES + 1);
  });
});
