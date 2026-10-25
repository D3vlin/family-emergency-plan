import { describe, expect, it } from "vitest";
import { computeFurthestAllowedStep, isStepValid, STEP_HEADER } from "@wizard/stepValidators";

describe("isStepValid", () => {
  it("step 1 (header) is valid with plan name and address filled", () => {
    expect(isStepValid(STEP_HEADER, { header: { planName: "Familia Perez", address: "Calle 1" } })).toBe(true);
  });

  it("step 1 is invalid with a missing required field", () => {
    expect(isStepValid(STEP_HEADER, { header: { planName: "", address: "Calle 1" } })).toBe(false);
    expect(isStepValid(STEP_HEADER, {})).toBe(false);
  });
});

describe("computeFurthestAllowedStep", () => {
  it("stays at step 1 when step 1 is invalid", () => {
    expect(computeFurthestAllowedStep({})).toBe(STEP_HEADER);
  });

  it("unlocks past step 1 once it's valid", () => {
    const data = { header: { planName: "Familia Perez", address: "Calle 1" } };
    expect(computeFurthestAllowedStep(data)).toBe(STEP_HEADER + 1);
  });
});
