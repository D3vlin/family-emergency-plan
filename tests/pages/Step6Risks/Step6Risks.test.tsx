import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Step6Risks from "@pages/Step6Risks/Step6Risks";
import { WizardProvider } from "@wizard/WizardContext";

function renderStep6() {
  return render(
    <WizardProvider>
      <Step6Risks />
    </WizardProvider>,
  );
}

afterEach(() => localStorage.clear());

describe("Step6Risks", () => {
  it("renders all fields from the brief (no dedicated story)", () => {
    renderStep6();
    expect(screen.getByLabelText(/riesgos al interior/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ruta de evacuación/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/identificación de peligros/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/punto de encuentro principal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/punto de encuentro alterno/i)).toBeInTheDocument();
  });

  it("saves free-text input without blocking the step (no required fields)", () => {
    renderStep6();
    fireEvent.change(screen.getByLabelText(/punto de encuentro principal/i), { target: { value: "Parque" } });
    expect(screen.getByLabelText(/punto de encuentro principal/i)).toHaveValue("Parque");
  });
});
