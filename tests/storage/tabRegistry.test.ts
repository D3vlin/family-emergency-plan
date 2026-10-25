import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPlan, savePlan } from "@storage/planStorage";
import { registerTab, TAB_COUNT_KEY } from "@storage/tabRegistry";

describe("tabRegistry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("keeps the plan when a tab unregisters while another tab is still open", () => {
    savePlan({ data: {}, lastVisitedPath: "/step/1", lastActivityAt: 0 });
    const unregisterTabA = registerTab();
    const unregisterTabB = registerTab();
    expect(localStorage.getItem(TAB_COUNT_KEY)).toBe("2");

    unregisterTabA();

    expect(localStorage.getItem(TAB_COUNT_KEY)).toBe("1");
    expect(loadPlan()).not.toBeNull();
    unregisterTabB();
  });

  it("does not clear the plan when the same tab reloads (brief gap at 0)", () => {
    savePlan({ data: { header: { planName: "Familia Perez" } }, lastVisitedPath: "/step/1", lastActivityAt: 0 });
    const unregisterTab = registerTab();

    unregisterTab();
    vi.advanceTimersByTime(50);
    registerTab();

    expect(loadPlan()).not.toBeNull();
  });

  it("clears the plan once the last tab has genuinely been gone past the grace window", () => {
    savePlan({ data: { header: { planName: "Familia Perez" } }, lastVisitedPath: "/step/1", lastActivityAt: 0 });
    const unregisterTab = registerTab();

    unregisterTab();
    vi.advanceTimersByTime(5000);
    registerTab();

    expect(loadPlan()).toBeNull();
  });
});
