import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STEP_TITLES } from "@constants/stepTitles";
import { TOTAL_STEPS } from "@wizard/stepValidators";
import ProgressBar from "@components/ProgressBar/ProgressBar";

function noop() {}

function pct(confirmedCount: number) {
  return Math.round((confirmedCount / TOTAL_STEPS) * 100);
}

describe("ProgressBar", () => {
  it("shows the app title on the page itself, not only in the browser tab", () => {
    render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
    expect(screen.getByText("Plan Familiar de Emergencias")).toBeInTheDocument();
  });

  it("shows the percentage and a check on completed (confirmed AND still valid) steps", () => {
    const data = { header: { planName: "Familia Perez", address: "Calle 1" }, confirmedSteps: [1] };
    render(<ProgressBar planData={data} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
    expect(screen.getByText(new RegExp(`${pct(1)}% completado`, "i"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Paso 1/ })).toHaveTextContent(`Paso 1 — ${STEP_TITLES[0]} ✓`);
  });

  it("does NOT count a step as complete until it's actually been confirmed", () => {
    render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
    expect(screen.getByText(/0% completado/i)).toBeInTheDocument();
  });

  it("only lets the user jump to completed steps or the current one", () => {
    render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
    expect(screen.getByRole("button", { name: /Paso 1/ })).toBeInTheDocument();
    if (TOTAL_STEPS > 1) {
      expect(screen.queryByRole("button", { name: /Paso 2/ })).not.toBeInTheDocument();
    }
  });

  it("shows a tooltip on each not-yet-reachable step instead of a dead control", () => {
    render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
    const disabledSteps = screen.queryAllByTitle(/Completá los pasos anteriores/i);
    expect(disabledSteps).toHaveLength(TOTAL_STEPS - 1);
  });

  it("calls onSelectStep with the step number when a reachable step is clicked", () => {
    const onSelectStep = vi.fn();
    render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={onSelectStep} />);
    fireEvent.click(screen.getByRole("button", { name: /Paso 1/ }));
    expect(onSelectStep).toHaveBeenCalledWith(1);
  });

  it("scrolls the current step's pill into view", () => {
    const scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
    render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    scrollSpy.mockRestore();
  });

  describe("highlighting the current step", () => {
    it("marks only the current step with aria-current", () => {
      render(<ProgressBar planData={{}} furthestAllowedStep={1} currentStep={1} onSelectStep={noop} />);
      expect(screen.getByRole("button", { name: /Paso 1/ })).toHaveAttribute("aria-current", "step");
    });

    it("the completed-step checkmark renders in its own element, not plain text, so it can be colored separately from the label", () => {
      render(
        <ProgressBar
          planData={{ header: { planName: "Familia Perez", address: "Calle 1" }, confirmedSteps: [1] }}
          furthestAllowedStep={1}
          currentStep={1}
          onSelectStep={noop}
        />,
      );
      const button = screen.getByRole("button", { name: /Paso 1/ });
      const check = button.querySelector("span");
      expect(check).not.toBeNull();
      expect(check).toHaveTextContent("✓");
    });
  });
});
