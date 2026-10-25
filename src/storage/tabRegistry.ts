import { safeGet, safeSet } from "@utils/safeStorage";
import { clearPlan } from "./planStorage";

export const TAB_COUNT_KEY = "plan-familiar-emergencias:tab-count";
export const TAB_HEARTBEAT_KEY = "plan-familiar-emergencias:tab-heartbeat";

const RELOAD_GRACE_MS = 1500;

function readCount(): number {
  return Number(safeGet(TAB_COUNT_KEY) ?? "0") || 0;
}

function touchHeartbeat(): void {
  safeSet(TAB_HEARTBEAT_KEY, String(Date.now()));
}

export function registerTab(): () => void {
  const count = readCount();
  if (count === 0) {
    const lastHeartbeat = Number(safeGet(TAB_HEARTBEAT_KEY) ?? "0");
    const gapSinceLastTab = Date.now() - lastHeartbeat;
    if (lastHeartbeat > 0 && gapSinceLastTab >= RELOAD_GRACE_MS) {
      clearPlan();
    }
  }

  safeSet(TAB_COUNT_KEY, String(count + 1));
  touchHeartbeat();

  return function unregisterTab() {
    const remaining = Math.max(readCount() - 1, 0);
    safeSet(TAB_COUNT_KEY, String(remaining));
    touchHeartbeat();
  };
}
