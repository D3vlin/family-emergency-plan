export interface ClosingData {
  lastReviewDate?: string;
  nextReviewDate?: string;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function isLastReviewDateValid(date: string): boolean {
  if (!date) return true;
  return date <= todayDateString();
}

export function isNextReviewDateValid(date: string): boolean {
  if (!date) return true;
  return date > todayDateString();
}

export function isClosingComplete(closing: ClosingData): boolean {
  return Boolean(
    closing.lastReviewDate &&
      closing.nextReviewDate &&
      isLastReviewDateValid(closing.lastReviewDate) &&
      isNextReviewDateValid(closing.nextReviewDate),
  );
}
