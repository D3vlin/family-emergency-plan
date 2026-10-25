import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TOTAL_STEPS } from "@wizard/stepValidators";
import WizardNav from "@components/WizardNav/WizardNav";

describe("WizardNav", () => {
  it("hides 'Anterior' on the first step", () => {
    render(<WizardNav currentStep={1} isCurrentStepValid onPrevious={() => {}} onNext={() => {}} />);
    expect(screen.queryByRole("button", { name: /anterior/i })).not.toBeInTheDocument();
  });

  it.skipIf(TOTAL_STEPS < 2)("shows 'Anterior' past the first step and calls onPrevious when clicked", () => {
    const onPrevious = vi.fn();
    render(<WizardNav currentStep={2} isCurrentStepValid onPrevious={onPrevious} onNext={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("hides 'Siguiente' once there's no further real step to reach", () => {
    render(<WizardNav currentStep={TOTAL_STEPS} isCurrentStepValid onPrevious={() => {}} onNext={() => {}} />);
    expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it.skipIf(TOTAL_STEPS < 2)(
    "disables 'Siguiente' with an explanatory tooltip while the current step is invalid",
    () => {
      render(<WizardNav currentStep={1} isCurrentStepValid={false} onPrevious={() => {}} onNext={() => {}} />);
      const next = screen.getByRole("button", { name: /siguiente/i });
      expect(next).toBeDisabled();
      expect(next).toHaveAttribute("title", "Completá los campos obligatorios de este paso para poder avanzar");
    },
  );

  it.skipIf(TOTAL_STEPS < 2)("calls onNext when 'Siguiente' is clicked and the step is valid", () => {
    const onNext = vi.fn();
    render(<WizardNav currentStep={1} isCurrentStepValid onPrevious={() => {}} onNext={onNext} />);
    const next = screen.getByRole("button", { name: /siguiente/i });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
