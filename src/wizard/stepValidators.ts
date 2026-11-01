import { isDisabilitySectionValid, isMemberComplete, type FamilyMember } from "./familyMember";
import type { Contact } from "./contact";
import type { HousingCheckData } from "@pages/Step8HousingCheck/Step8HousingCheck";
import { isPetComplete, type Pet } from "./pet";

export const TOTAL_STEPS = 9;

export const STEP_HEADER = 1;
export const STEP_FAMILY = 2;
export const STEP_CONTACTS = 3;
export const STEP_DISABILITIES = 4;
export const STEP_SITES = 5;
export const STEP_RISKS = 6;
export const STEP_EMERGENCY_KIT = 7;
export const STEP_HOUSING_CHECK = 8;
export const STEP_PETS = 9;

export interface HeaderStepData {
  planName?: string;
  address?: string;
}

export interface PlanData {
  header?: HeaderStepData;
  familyMembers?: FamilyMember[];
  contacts?: Contact[];
  disabilitiesNotApplicable?: boolean;
  housingCheck?: HousingCheckData;
  pets?: Pet[];
  petsNotApplicable?: boolean;
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
  if (step === STEP_DISABILITIES) {
    if (data.disabilitiesNotApplicable) return true;
    const members = data.familyMembers ?? [];
    const hasAnyDisability = members.some((m) => m.disabilities.length > 0);
    return hasAnyDisability && members.every(isDisabilitySectionValid);
  }
  if (step === STEP_HOUSING_CHECK) {
    const housingCheck = data.housingCheck ?? {};
    return Object.values(housingCheck).every((entry) => Boolean(entry?.status));
  }
  if (step === STEP_PETS) {
    if (data.petsNotApplicable) return true;
    const pets = data.pets ?? [];
    return pets.length > 0 && pets.every(isPetComplete);
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
