import { useEffect, useRef } from "react";
import { isStepValid, TOTAL_STEPS, type PlanData } from "@wizard/stepValidators";
import { STEP_TITLES } from "@constants/stepTitles";
import { Z_INDEX } from "@constants/theme";

interface ProgressBarProps {
  planData: PlanData;
  furthestAllowedStep: number;
  currentStep: number;
  onSelectStep: (step: number) => void;
}

export default function ProgressBar({ planData, furthestAllowedStep, currentStep, onSelectStep }: ProgressBarProps) {
  const confirmedSteps = new Set((planData.confirmedSteps as number[] | undefined) ?? []);
  function isStepComplete(step: number): boolean {
    return confirmedSteps.has(step) && isStepValid(step, planData);
  }
  const completedCount = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).filter(isStepComplete).length;
  const percentage = Math.round((completedCount / TOTAL_STEPS) * 100);

  const currentPillRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    currentPillRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentStep]);

  return (
    <nav
      aria-label="Progreso del plan"
      className="sticky top-0 border-b border-slate-200 bg-background/95 px-4 py-2 text-primary backdrop-blur-sm dark:border-slate-700"
      style={{ zIndex: Z_INDEX.progressBar }}
    >
      <div className="mx-auto max-w-4xl">
        <p className="text-3xl font-semibold uppercase tracking-wide text-primary">Plan Familiar de Emergencias</p>
        <div className="mt-1 flex items-center justify-between text-2xl font-medium">
          <span>{percentage}% completado</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <ol className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
            const complete = isStepComplete(step);
            const reachable = step <= furthestAllowedStep;
            const isCurrent = step === currentStep;
            return (
              <li key={step} className="shrink-0" ref={isCurrent ? currentPillRef : undefined}>
                {reachable ? (
                  <button
                    type="button"
                    onClick={() => onSelectStep(step)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`block whitespace-nowrap rounded-full border px-2 py-1 text-xs ${
                      isCurrent
                        ? "border-accent bg-accent/10 font-semibold text-primary"
                        : "border-primary/20 text-primary hover:bg-primary/5"
                    }`}
                  >
                    Paso {step} — {STEP_TITLES[step - 1]} {complete ? <span className="text-accent">✓</span> : ""}
                  </button>
                ) : (
                  <span
                    title="Completá los pasos anteriores para poder avanzar hasta acá"
                    aria-disabled="true"
                    className="block whitespace-nowrap rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500"
                  >
                    Paso {step} — {STEP_TITLES[step - 1]}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
