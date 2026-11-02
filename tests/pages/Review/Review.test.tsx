import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WizardProvider } from "@wizard/WizardContext";
import { savePlan } from "@storage/planStorage";
import * as exportPlan from "@pdf/exportPlan";
import Review from "@pages/Review/Review";

function seedAndRender(data: Record<string, unknown>) {
  savePlan({ data, lastVisitedPath: "/review", lastActivityAt: Date.now() });
  return render(
    <WizardProvider>
      <Review />
    </WizardProvider>,
  );
}

const completeMember = {
  id: "m1",
  name: "Ana Pérez",
  documentType: "Cédula de Ciudadanía",
  documentNumber: "123",
  relationship: "Madre",
  age: "35",
  phones: [],
  illnesses: [],
  medications: [],
  disabilities: [{ id: "d1", type: "Visual" }],
  requiresLifeSupport: "No requiere",
  frequentSites: [],
};

const FAR_FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString().slice(0, 10);

const basePlan = {
  header: { planName: "Familia Pérez", address: "Calle 123" },
  familyMembers: [completeMember],
  contacts: [],
  disabilitiesNotApplicable: false,
  petsNotApplicable: true,
  pets: [],
  risks: {
    insideRisks: "Estufa a gas",
    evacuationRoute: "Escalera principal",
    surroundingHazards: "Río cercano",
    mainMeetingPoint: "Parque central",
    alternateMeetingPoint: "Casa de un vecino",
  },
  emergencyKit: { survivalSupplies: { Agua: true }, complementaryItems: {} },
  housingCheck: { "Tienen extintores": { status: "bueno" } },
  closing: { lastReviewDate: "2026-10-16", nextReviewDate: FAR_FUTURE_DATE },
};

afterEach(() => localStorage.clear());

describe("Review", () => {
  it("shows all 9 step sections, each with its own Editar button, plus a Cierre section edited inline (no Editar — Cierre isn't a wizard step)", () => {
    seedAndRender(basePlan);
    for (let step = 1; step <= 9; step += 1) {
      const section = screen.getByTestId(`review-section-${step}`);
      expect(within(section).getByRole("button", { name: /editar/i })).toBeInTheDocument();
    }
    const closingSection = screen.getByTestId("review-section-closing");
    expect(within(closingSection).queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });

  it("shows a numeric summary of members and people with disabilities, omitting mascotas entirely when there are none", () => {
    seedAndRender(basePlan);
    const summary = screen.getByText(/1 integrante/i);
    expect(summary).toBeInTheDocument();
    expect(summary).not.toHaveTextContent(/mascota/i);
    expect(screen.getByText(/1 persona con discapacidad/i)).toBeInTheDocument();
  });

  it("includes the mascotas count in the summary once there's at least one pet", () => {
    const pet = {
      id: "p1",
      name: "Firulais",
      species: "Perro",
      stressBehavior: "",
      strangerBehavior: "",
      medications: "",
      specialDiet: "",
      illnesses: "",
      disabilities: "",
      vetName: "",
      vetPhone: "",
      caretakerName: "",
      caretakerPhone: "",
      kit: {},
    };
    seedAndRender({ ...basePlan, petsNotApplicable: false, pets: [pet] });
    expect(screen.getByText(/1 mascota\b/i)).toBeInTheDocument();
  });

  it("shows a message when the additional-contacts list is empty", () => {
    seedAndRender(basePlan);
    const section = screen.getByTestId("review-section-3");
    expect(within(section).getByText(/sin contactos adicionales agregados/i)).toBeInTheDocument();
  });

  it("does not show a fixed 'Emergencias — 123' row — it's a universal number, not data this plan tracks", () => {
    seedAndRender(basePlan);
    const section = screen.getByTestId("review-section-3");
    expect(within(section).queryByText(/emergencias/i)).not.toBeInTheDocument();
    expect(within(section).queryByText("123")).not.toBeInTheDocument();
  });

  it("summarizes header, risks and closing with their literal fields (steps without their own story)", () => {
    seedAndRender(basePlan);
    expect(within(screen.getByTestId("review-section-1")).getByText(/Familia Pérez/)).toBeInTheDocument();
    expect(within(screen.getByTestId("review-section-6")).getByText(/Estufa a gas/)).toBeInTheDocument();
    expect(within(screen.getByTestId("review-section-closing")).getByText(/2026-10-16/)).toBeInTheDocument();
  });

  it("summarizes the emergency kit and housing check as counts", () => {
    seedAndRender(basePlan);
    expect(within(screen.getByTestId("review-section-7")).getByText(/completados 1 de 24/i)).toBeInTheDocument();
    expect(within(screen.getByTestId("review-section-8")).getByText(/1 ítems? en buen estado de 15/i)).toBeInTheDocument();
  });

  it("shows the pet kit warning in two levels when an item is SI without an expiry date", () => {
    const pet = {
      id: "p1",
      name: "Firulais",
      species: "Perro",
      stressBehavior: "",
      strangerBehavior: "",
      medications: "",
      specialDiet: "",
      illnesses: "",
      disabilities: "",
      vetName: "",
      vetPhone: "",
      caretakerName: "",
      caretakerPhone: "",
      kit: { "Botiquín de primeros auxilios": { checked: true, expiryOrNotes: "" } },
    };
    seedAndRender({ ...basePlan, petsNotApplicable: false, pets: [pet] });
    const section = screen.getByTestId("review-section-9");
    expect(within(section).getByText(/1 ítems? del kit sin fecha de vencimiento/i)).toBeInTheDocument();
    expect(within(section).getByText(/Botiquín de primeros auxilios/)).toBeInTheDocument();
  });

  it("has no generic 'Finalizar' button, but has 'Descargar PDF'", () => {
    seedAndRender(basePlan);
    expect(screen.queryByRole("button", { name: /^finalizar$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /descargar pdf/i })).toBeInTheDocument();
  });

  it("flags an invalid step with an alert and highlights its Editar button", () => {
    seedAndRender({ ...basePlan, familyMembers: [{ ...completeMember, name: "" }] });
    const section = screen.getByTestId("review-section-2");
    expect(within(section).getByRole("alert")).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: /editar/i })).toHaveAttribute("data-highlighted", "true");
  });

  it("Cierre: defaults última revisión to today and requires próxima revisión before 'Descargar PDF' is enabled", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
    seedAndRender({ ...basePlan, closing: {} });
    expect(screen.getByText(/última revisión: hoy \(2026-10-20\)/i)).toBeInTheDocument();

    const downloadButton = screen.getByRole("button", { name: /descargar pdf/i });
    expect(downloadButton).toBeDisabled();

    const closingSection = screen.getByTestId("review-section-closing");
    fireEvent.change(screen.getByLabelText(/fecha de próxima revisión/i), { target: { value: "2026-10-20" } });
    expect(within(closingSection).getByRole("alert")).toHaveTextContent(/debe ser una fecha futura/i);
    expect(downloadButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/fecha de próxima revisión/i), { target: { value: "2026-10-25" } });
    expect(within(closingSection).queryByRole("alert")).not.toBeInTheDocument();
    expect(downloadButton).toBeEnabled();
    vi.useRealTimers();
  });

  it("downloads the PDF with a filename built from the plan name", async () => {
    const saveSpy = vi.fn();
    vi.spyOn(exportPlan, "generatePlanPdf").mockReturnValue({ save: saveSpy } as unknown as ReturnType<
      typeof exportPlan.generatePlanPdf
    >);
    seedAndRender(basePlan);
    fireEvent.click(screen.getByRole("button", { name: /descargar pdf/i }));
    await waitFor(() => expect(saveSpy).toHaveBeenCalledWith("plan-familia-perez.pdf"));
    vi.restoreAllMocks();
  });

  it("shows a generic error and allows retrying when PDF generation fails", async () => {
    const spy = vi.spyOn(exportPlan, "generatePlanPdf").mockImplementation(() => {
      throw new Error("boom");
    });
    seedAndRender(basePlan);
    const button = screen.getByRole("button", { name: /descargar pdf/i });

    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/no se pudo generar el pdf/i));
    expect(button).toBeEnabled();

    spy.mockRestore();
  });

  it("shows a 'Generando…' loading state while the PDF is being built", async () => {
    const saveSpy = vi.fn();
    vi.spyOn(exportPlan, "generatePlanPdf").mockReturnValue({ save: saveSpy } as unknown as ReturnType<
      typeof exportPlan.generatePlanPdf
    >);
    seedAndRender(basePlan);
    const button = screen.getByRole("button", { name: /descargar pdf/i });

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: /generando/i })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: /descargar pdf/i })).toBeEnabled());
    vi.restoreAllMocks();
  });
});
