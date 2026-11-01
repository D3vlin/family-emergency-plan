import { act, fireEvent, render, screen, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { STORAGE_KEY, savePlan } from "@storage/planStorage";
import { getTabId, TAB_LOCK_KEY } from "@storage/tabLock";
import { INACTIVITY_EXPIRE_MS, INACTIVITY_WARNING_MS } from "@constants/timing";

function startFresh() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /comenzar/i }));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
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

describe("Cross-tab edit notice", () => {
  it("explains that another tab is editing the same plan", () => {
    startFresh();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: "{}" }));
    });
    expect(screen.getByText(/se está editando en otra pestaña/i)).toBeInTheDocument();
  });

  describe("'Trabajar solo desde aquí' — exclusive editing", () => {
    it("re-syncs this tab's data from storage before claiming the lock, so the other tab's save isn't lost", () => {
      savePlan({ data: { header: { planName: "Original" } }, lastVisitedPath: "/step/1", lastActivityAt: Date.now() });
      render(<App />);
      expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue("Original");

      act(() => {
        savePlan({ data: { header: { planName: "Nuevo" } }, lastVisitedPath: "/step/1", lastActivityAt: Date.now() });
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: "irrelevant" }));
      });
      expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue("Original");

      fireEvent.click(screen.getByRole("button", { name: /trabajar solo desde aquí/i }));

      expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue("Nuevo");
      expect(screen.queryByText(/se está editando en otra pestaña/i)).not.toBeInTheDocument();
      expect(localStorage.getItem(TAB_LOCK_KEY)).toBe(getTabId());
    });

    it("a lock claimed by a different tab id blocks this tab instead of showing the editable banner", () => {
      startFresh();
      act(() => {
        localStorage.setItem(TAB_LOCK_KEY, "some-other-tab-id");
        window.dispatchEvent(new StorageEvent("storage", { key: TAB_LOCK_KEY, newValue: "some-other-tab-id" }));
      });

      const dialog = screen.getByRole("alertdialog", { name: /pestaña bloqueada/i });
      expect(within(dialog).getByText(/podés cerrar esta pestaña/i)).toBeInTheDocument();
      expect(within(dialog).queryByRole("button")).not.toBeInTheDocument();
    });

    it("releasing the lock (its holder closed or reloaded) unlocks this tab and re-syncs its data", () => {
      startFresh();
      act(() => {
        localStorage.setItem(TAB_LOCK_KEY, "some-other-tab-id");
        window.dispatchEvent(new StorageEvent("storage", { key: TAB_LOCK_KEY, newValue: "some-other-tab-id" }));
      });
      expect(screen.getByRole("alertdialog", { name: /pestaña bloqueada/i })).toBeInTheDocument();

      act(() => {
        savePlan({
          data: { header: { planName: "Guardado antes de cerrar" } },
          lastVisitedPath: "/step/1",
          lastActivityAt: Date.now(),
        });
        localStorage.removeItem(TAB_LOCK_KEY);
        window.dispatchEvent(new StorageEvent("storage", { key: TAB_LOCK_KEY, newValue: null }));
      });

      expect(screen.queryByRole("alertdialog", { name: /pestaña bloqueada/i })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue("Guardado antes de cerrar");
    });
  });
});

describe("Reaching and returning from the review screen", () => {
  const completeMember = {
    id: "1",
    name: "Ana",
    documentType: "Cédula de Ciudadanía",
    documentNumber: "123",
    relationship: "",
    age: "30",
    phones: [],
    illnesses: [],
    medications: [],
    disabilities: [],
    requiresLifeSupport: "",
    frequentSites: [],
  };
  const completePlan = {
    header: { planName: "Familia Perez", address: "Calle 1" },
    familyMembers: [completeMember],
    disabilitiesNotApplicable: true,
    petsNotApplicable: true,
    pets: [],
  };

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  function reviewOwnScrollCallCount() {
    return (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call.length === 0,
    ).length;
  }

  it("advances from step 9 to the review screen via Siguiente", () => {
    savePlan({ data: completePlan, lastVisitedPath: "/step/9", lastActivityAt: Date.now() });
    render(<App />);
    expect(screen.getByRole("heading", { name: /Paso 9\b/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByRole("heading", { name: /revisión final/i })).toBeInTheDocument();
  });

  it("re-focuses the single section touched during the detour", () => {
    savePlan({ data: completePlan, lastVisitedPath: "/review", lastActivityAt: Date.now() });
    render(<App />);

    const section2 = screen.getByTestId("review-section-2");
    fireEvent.click(within(section2).getByRole("button", { name: /editar/i }));
    expect(screen.getByRole("heading", { name: /Paso 2\b/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /volver a la revisión/i }));
    expect(screen.getByRole("heading", { name: /revisión final/i })).toBeInTheDocument();
    expect(reviewOwnScrollCallCount()).toBe(1);
  });

  it("opens from the top when more than one section was touched during the detour", () => {
    savePlan({ data: completePlan, lastVisitedPath: "/review", lastActivityAt: Date.now() });
    render(<App />);

    const section1 = screen.getByTestId("review-section-1");
    fireEvent.click(within(section1).getByRole("button", { name: /editar/i }));
    expect(screen.getByRole("heading", { name: /Paso 1\b/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByRole("heading", { name: /Paso 2\b/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /volver a la revisión/i }));
    expect(screen.getByRole("heading", { name: /revisión final/i })).toBeInTheDocument();
    expect(reviewOwnScrollCallCount()).toBe(0);
  });
});
