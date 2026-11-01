import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StepPage from "@components/StepPage/StepPage";

describe("StepPage", () => {
  it("renders the step number and its title from STEP_TITLES", () => {
    render(<StepPage step={6}>contenido</StepPage>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Paso 6 — Riesgos y puntos de encuentro");
  });

  it("renders its children inside the main landmark", () => {
    render(
      <StepPage step={1}>
        <p>Formulario del paso</p>
      </StepPage>,
    );
    expect(screen.getByRole("main")).toHaveTextContent("Formulario del paso");
  });
});
