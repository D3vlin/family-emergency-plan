import type { ReactNode } from "react";
import { STEP_TITLES } from "@constants/stepTitles";

interface StepPageProps {
  step: number;
  children: ReactNode;
}

export default function StepPage({ step, children }: StepPageProps) {
  return (
    <main>
      <h1 className="page-title">
        Paso {step} — {STEP_TITLES[step - 1]}
      </h1>
      {children}
    </main>
  );
}
