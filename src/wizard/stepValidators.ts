export const TOTAL_STEPS = 1;

export const STEP_HEADER = 1;

export interface HeaderStepData {
  planName?: string;
  address?: string;
}

export interface PlanData {
  header?: HeaderStepData;
  visitedSteps?: number[];
  confirmedSteps?: number[];
  [section: string]: unknown;
}

export function isStepValid(step: number, data: PlanData): boolean {
  if (step === STEP_HEADER) {
    const header = data.header ?? {};
    return Boolean(header.planName?.trim() && header.address?.trim());
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
