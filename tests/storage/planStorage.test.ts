import { afterEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, clearPlan, loadPlan, savePlan, type PlanState } from "@storage/planStorage";

const samplePlan: PlanState = {
  data: { header: { planName: "Familia Perez", address: "Calle 1" } },
  lastVisitedPath: "/step/1",
  lastActivityAt: 1000,
};

describe("planStorage", () => {
  afterEach(() => localStorage.clear());

  it("returns null when nothing was saved yet (first visit)", () => {
    expect(loadPlan()).toBeNull();
  });

  it("round-trips a saved plan through loadPlan (happy path)", () => {
    savePlan(samplePlan);
    expect(loadPlan()).toEqual(samplePlan);
  });

  it("returns null instead of throwing on corrupted stored JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadPlan()).toBeNull();
  });

  it.each([
    ["a bare string instead of an object", JSON.stringify("oops")],
    ["an array instead of an object", JSON.stringify([1, 2, 3])],
    ["data as a string instead of an object", JSON.stringify({ data: "oops", lastVisitedPath: "/step/1", lastActivityAt: 1 })],
    ["data as an array instead of an object", JSON.stringify({ data: [], lastVisitedPath: "/step/1", lastActivityAt: 1 })],
    ["lastVisitedPath missing", JSON.stringify({ data: {}, lastActivityAt: 1 })],
    ["lastActivityAt as a string instead of a number", JSON.stringify({ data: {}, lastVisitedPath: "/step/1", lastActivityAt: "1" })],
  ])("returns null for valid JSON with the wrong shape: %s", (_label, raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(loadPlan()).toBeNull();
  });

  it("removes the stored plan (closing the last tab clears it immediately)", () => {
    savePlan(samplePlan);
    clearPlan();
    expect(loadPlan()).toBeNull();
  });
});
