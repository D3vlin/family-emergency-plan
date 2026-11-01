import { afterEach, describe, expect, it } from "vitest";
import { claimExclusiveEditing, getTabId, isLockedByAnotherTab, releaseExclusiveEditingIfOwner, TAB_LOCK_KEY } from "@storage/tabLock";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("tabLock", () => {
  it("is not locked when no tab holds the lock", () => {
    expect(isLockedByAnotherTab()).toBe(false);
  });

  it("claiming the lock does not lock out the same tab", () => {
    claimExclusiveEditing();
    expect(localStorage.getItem(TAB_LOCK_KEY)).toBe(getTabId());
    expect(isLockedByAnotherTab()).toBe(false);
  });

  it("a lock claimed by a different tab id locks this one out", () => {
    localStorage.setItem(TAB_LOCK_KEY, "some-other-tab-id");
    expect(isLockedByAnotherTab()).toBe(true);
  });

  it("getTabId() is stable across calls (persisted in sessionStorage, not regenerated)", () => {
    const first = getTabId();
    const second = getTabId();
    expect(first).toBe(second);
  });

  it("releaseExclusiveEditingIfOwner() only clears the lock if this tab is the holder", () => {
    localStorage.setItem(TAB_LOCK_KEY, "some-other-tab-id");
    releaseExclusiveEditingIfOwner();
    expect(localStorage.getItem(TAB_LOCK_KEY)).toBe("some-other-tab-id");

    claimExclusiveEditing();
    releaseExclusiveEditingIfOwner();
    expect(localStorage.getItem(TAB_LOCK_KEY)).toBeNull();
  });
});
