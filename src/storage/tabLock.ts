import { safeGet, safeRemove, safeSessionGet, safeSessionSet, safeSet } from "@utils/safeStorage";

export const TAB_LOCK_KEY = "plan-familiar-emergencias:active-tab-id";
const TAB_ID_SESSION_KEY = "plan-familiar-emergencias:tab-id";

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function getTabId(): string {
  const existing = safeSessionGet(TAB_ID_SESSION_KEY);
  if (existing) return existing;
  const id = randomId();
  safeSessionSet(TAB_ID_SESSION_KEY, id);
  return id;
}

export function claimExclusiveEditing(): void {
  safeSet(TAB_LOCK_KEY, getTabId());
}

export function isLockedByAnotherTab(): boolean {
  const holder = safeGet(TAB_LOCK_KEY);
  return holder !== null && holder !== getTabId();
}

export function releaseExclusiveEditingIfOwner(): void {
  if (safeGet(TAB_LOCK_KEY) === getTabId()) {
    safeRemove(TAB_LOCK_KEY);
  }
}
