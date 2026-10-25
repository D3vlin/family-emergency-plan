import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { STORAGE_KEY, savePlan } from "@storage/planStorage";
import { INACTIVITY_EXPIRE_MS, INACTIVITY_WARNING_MS } from "@constants/timing";

function startFresh() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /comenzar/i }));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Wizard navigation guard", () => {
  it("blocks Siguiente while Step 1's required fields are empty", () => {
    startFresh();
    expect(screen.getByLabelText(/nombre del plan/i)).toBeRequired();
    expect(screen.getByLabelText(/dirección de la vivienda/i)).toBeRequired();
  });

  it("labels the address field as the household's address, not a bare 'Dirección'", () => {
    startFresh();
    expect(screen.getByLabelText(/dirección de la vivienda/i)).toBeInTheDocument();
  });

  it("saves progress as Step 1's fields are filled", () => {
    startFresh();
    fireEvent.change(screen.getByLabelText(/nombre del plan/i), { target: { value: "Familia Perez" } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: "Calle 1" } });

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.data.header).toEqual({ planName: "Familia Perez", address: "Calle 1" });
    expect(saved.lastVisitedPath).toBe("/step/1");
  });
});

describe("Resuming progress within the same tab session", () => {
  it("silently restores the last visited screen on reload, not just Home", () => {
    savePlan({
      data: { header: { planName: "Familia Perez", address: "Calle 1" } },
      lastVisitedPath: "/step/1",
      lastActivityAt: Date.now(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: /Paso 1\b/i })).toBeInTheDocument();
  });

  it("clears an already-expired plan on reload and starts fresh at Home, no warning modal", () => {
    savePlan({
      data: { header: { planName: "Familia Perez", address: "Calle 1" } },
      lastVisitedPath: "/step/1",
      lastActivityAt: Date.now() - INACTIVITY_EXPIRE_MS - 1000,
    });

    render(<App />);
    expect(screen.getByRole("heading", { name: /Plan Familiar de Emergencias/i })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /comenzar/i }));
    expect(screen.getByRole("heading", { name: /Paso 1\b/i })).toBeInTheDocument();
  });
});

describe("Inactivity expiration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the 13-minute warning and 'Seguir trabajando' resets the countdown", () => {
    startFresh();

    act(() => {
      vi.advanceTimersByTime(INACTIVITY_WARNING_MS);
    });
    expect(screen.getByRole("alertdialog", { name: /aviso de inactividad/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /seguir trabajando/i }));
    expect(screen.queryByRole("alertdialog", { name: /aviso de inactividad/i })).not.toBeInTheDocument();
  });

  it("clears the plan and shows the redirect modal after 15 minutes with no response", () => {
    savePlan({ data: {}, lastVisitedPath: "/step/1", lastActivityAt: Date.now() });
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(INACTIVITY_EXPIRE_MS);
    });

    expect(screen.getByRole("alertdialog", { name: /progreso expirado/i })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /ir al inicio/i }));
    expect(screen.getByRole("heading", { name: /Paso 1\b/i })).toBeInTheDocument();
  });
});

describe("Privacy/non-affiliation disclosure", () => {
  it("is visible on Home, before 'Comenzar', not as a popup after starting the wizard", () => {
    render(<App />);
    expect(screen.getByText(/no es una herramienta oficial de la UNGRD/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /comenzar/i }));
    expect(screen.getByRole("heading", { name: /Paso 1\b/i })).toBeInTheDocument();
    expect(screen.queryByText(/no es una herramienta oficial de la UNGRD/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Formato Plan Familiar/i)).toBeInTheDocument();
  });

  it("is skipped (along with the rest of Home) when resuming a still-valid session", () => {
    savePlan({ data: {}, lastVisitedPath: "/step/1", lastActivityAt: Date.now() });
    render(<App />);
    expect(screen.queryByText(/no es una herramienta oficial de la UNGRD/i)).not.toBeInTheDocument();
  });
});
