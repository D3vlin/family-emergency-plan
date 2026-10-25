import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardProvider } from "@wizard/WizardContext";
import Home from "@pages/Home/Home";

function renderHome() {
  return render(
    <WizardProvider>
      <Home />
    </WizardProvider>,
  );
}

describe("Home", () => {
  it("shows the hero title and a button to start the wizard at Step 1", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: /Plan Familiar de Emergencias/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /comenzar/i })).toBeInTheDocument();
  });

  it("cites the UNGRD source, same as every other screen", () => {
    renderHome();
    expect(screen.getByText(/Formato Plan Familiar/i)).toBeInTheDocument();
  });

  it("shows the privacy disclosure as visible text, before 'Comenzar' — not a popup", () => {
    renderHome();
    expect(screen.getByText(/solo en este navegador/i)).toBeInTheDocument();
    expect(screen.getByText(/15 minutos de inactividad/i)).toBeInTheDocument();
  });
});
