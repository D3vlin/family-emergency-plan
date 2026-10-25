import { isMemberComplete, type FamilyMember } from "./familyMember";
import type { Contact } from "./contact";

export const TOTAL_STEPS = 3;

export const STEP_HEADER = 1;
export const STEP_FAMILY = 2;
export const STEP_CONTACTS = 3;

export interface HeaderStepData {
  planName?: string;
  address?: string;
}

export interface PlanData {
  header?: HeaderStepData;
  familyMembers?: FamilyMember[];
  contacts?: Contact[];
  visitedSteps?: number[];
  confirmedSteps?: number[];
  [section: string]: unknown;
}

export function isStepValid(step: number, data: PlanData): boolean {
  if (step === STEP_HEADER) {
    const header = data.header ?? {};
    return Boolean(header.planName?.trim() && header.address?.trim());
  }
  if (step === STEP_FAMILY) {
    const members = data.familyMembers ?? [];
    return members.length > 0 && members.every(isMemberComplete);
  }
  return true;
}

export function computeFurthestAllowedStep(data: PlanData): number {
  let step = 1;
  while (step <= TOTAL_STEPS && isStepValid(step, data)) {
    step += 1;
  }
  return step;
}
