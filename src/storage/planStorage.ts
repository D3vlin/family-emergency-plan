import { safeGet, safeRemove, safeSet } from "@utils/safeStorage";

export const STORAGE_KEY = "plan-familiar-emergencias";

export interface PlanState {
  data: Record<string, unknown>;
  lastVisitedPath: string;
  lastActivityAt: number;
}

export function isValidPlanState(value: unknown): value is PlanState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.data === "object" &&
    candidate.data !== null &&
    !Array.isArray(candidate.data) &&
    typeof candidate.lastVisitedPath === "string" &&
    typeof candidate.lastActivityAt === "number"
  );
}

export function loadPlan(): PlanState | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return isValidPlanState(parsed) ? parsed : null;
}

export function savePlan(state: PlanState): void {
  safeSet(STORAGE_KEY, JSON.stringify(state));
}

export function clearPlan(): void {
  safeRemove(STORAGE_KEY);
}
