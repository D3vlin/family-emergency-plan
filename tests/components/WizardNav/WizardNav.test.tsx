import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TOTAL_STEPS } from "@wizard/stepValidators";
import WizardNav from "@components/WizardNav/WizardNav";

function renderNav(overrides: Partial<React.ComponentProps<typeof WizardNav>> = {}) {
  return render(
    <WizardNav
      currentStep={1}
      isCurrentStepValid
      isEditingFromReview={false}
      onReturnToReview={() => {}}
      onPrevious={() => {}}
      onNext={() => {}}
      {...overrides}
    />,
  );
}

describe("WizardNav", () => {
  it("hides 'Anterior' on the first step", () => {
    renderNav({ currentStep: 1 });
    expect(screen.queryByRole("button", { name: /anterior/i })).not.toBeInTheDocument();
  });

  it.skipIf(TOTAL_STEPS < 2)("shows 'Anterior' past the first step and calls onPrevious when clicked", () => {
    const onPrevious = vi.fn();
    renderNav({ currentStep: 2, onPrevious });
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("shows 'Siguiente' on the last real step, to advance into the review screen", () => {
    renderNav({ currentStep: TOTAL_STEPS });
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeInTheDocument();
  });

  it("hides 'Siguiente' once on the review screen itself", () => {
    renderNav({ currentStep: TOTAL_STEPS + 1 });
    expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it.skipIf(TOTAL_STEPS < 2)(
    "disables 'Siguiente' with an explanatory tooltip while the current step is invalid",
    () => {
      renderNav({ currentStep: 1, isCurrentStepValid: false });
      const next = screen.getByRole("button", { name: /siguiente/i });
      expect(next).toBeDisabled();
      expect(next).toHaveAttribute("title", "Completá los campos obligatorios de este paso para poder avanzar");
    },
  );

  it.skipIf(TOTAL_STEPS < 2)("calls onNext when 'Siguiente' is clicked and the step is valid", () => {
    const onNext = vi.fn();
    renderNav({ currentStep: 1, onNext });
    const next = screen.getByRole("button", { name: /siguiente/i });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("hides 'Volver a la revisión' unless editing from the review screen", () => {
    renderNav({ isEditingFromReview: false });
    expect(screen.queryByRole("button", { name: /volver a la revisión/i })).not.toBeInTheDocument();
  });

  it("shows 'Volver a la revisión' and calls onReturnToReview when editing from the review screen", () => {
    const onReturnToReview = vi.fn();
    renderNav({ isEditingFromReview: true, onReturnToReview });
    fireEvent.click(screen.getByRole("button", { name: /volver a la revisión/i }));
    expect(onReturnToReview).toHaveBeenCalledTimes(1);
  });
});
