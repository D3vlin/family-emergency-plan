import { TOTAL_STEPS } from "@wizard/stepValidators";

interface WizardNavProps {
  currentStep: number; // 1..TOTAL_STEPS
  isCurrentStepValid: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function WizardNav({ currentStep, isCurrentStepValid, onPrevious, onNext }: WizardNavProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <div className="ml-auto flex gap-3">
        {currentStep > 1 && (
          <button type="button" className="btn-secondary" onClick={onPrevious}>
            Anterior
          </button>
        )}
        {currentStep < TOTAL_STEPS && (
          <button
            type="button"
            className="btn-primary"
            disabled={!isCurrentStepValid}
            title={isCurrentStepValid ? undefined : "Completá los campos obligatorios de este paso para poder avanzar"}
            onClick={onNext}
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
