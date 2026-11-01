import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Step5FrequentSites from "@pages/Step5FrequentSites/Step5FrequentSites";
import { savePlan } from "@storage/planStorage";
import { createEmptyMember, MAX_SITES_PER_MEMBER } from "@wizard/familyMember";
import { WizardProvider } from "@wizard/WizardContext";

function seedMember() {
  const member = { ...createEmptyMember("m1"), name: "Ana", documentType: "Cédula de Ciudadanía", documentNumber: "1" };
  savePlan({ data: { familyMembers: [member] }, lastVisitedPath: "/step/5", lastActivityAt: Date.now() });
}

function renderStep5() {
  return render(
    <WizardProvider>
      <Step5FrequentSites />
    </WizardProvider>,
  );
}

function openAddSite() {
  fireEvent.click(screen.getByRole("button", { name: /agregar sitio/i }));
}

function fillSite({ site, phone }: { site?: string; phone?: string }) {
  if (site !== undefined) {
    fireEvent.change(screen.getByLabelText(/^sitio$/i), { target: { value: site } });
  }
  if (phone !== undefined) {
    fireEvent.change(screen.getByLabelText(/^teléfono$/i), { target: { value: phone } });
  }
}

function submitSite() {
  fireEvent.click(screen.getByRole("button", { name: /^agregar$/i }));
}

afterEach(() => localStorage.clear());

describe("Step5FrequentSites", () => {
  it("adds a site with only the site field required", () => {
    seedMember();
    renderStep5();
    openAddSite();
    fillSite({ site: "Parque Central" });
    submitSite();

    expect(within(screen.getByRole("table")).getByText("Parque Central")).toBeInTheDocument();
  });

  it("keeps Agregar disabled until the site field is filled", () => {
    seedMember();
    renderStep5();
    openAddSite();
    expect(screen.getByRole("button", { name: /^agregar$/i })).toBeDisabled();

    fillSite({ site: "Parque Central" });
    expect(screen.getByRole("button", { name: /^agregar$/i })).toBeEnabled();
  });

  it("strips letters out of the phone field as they're typed", () => {
    seedMember();
    renderStep5();
    openAddSite();
    fillSite({ site: "Colegio", phone: "abc123" });
    expect(screen.getByLabelText(/^teléfono$/i)).toHaveValue("123");
  });

  it("blocks an invalid phone format on the contact", () => {
    seedMember();
    renderStep5();
    openAddSite();
    fillSite({ site: "Colegio", phone: "+--" });
    submitSite();
    expect(screen.getByRole("alert")).toHaveTextContent(/formato inválido/i);
  });

  it("blocks adding a duplicate site for the same member", () => {
    seedMember();
    renderStep5();
    openAddSite();
    fillSite({ site: "Parque Central" });
    submitSite();
    openAddSite();
    fillSite({ site: "parque   central" });
    submitSite();

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/ya está registrado/i);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  });

  it("a member can have zero sites without blocking anything", () => {
    seedMember();
    renderStep5();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/sin sitios frecuentes agregados todavía/i)).toBeInTheDocument();
  });

  it("disables 'Agregar sitio' once the limit of 20 is reached", () => {
    seedMember();
    renderStep5();
    for (let i = 0; i < MAX_SITES_PER_MEMBER; i += 1) {
      openAddSite();
      fillSite({ site: `Sitio ${i}` });
      submitSite();
    }
    expect(screen.getByRole("button", { name: /agregar sitio/i })).toBeDisabled();
  });

  describe("table + modal", () => {
    it("shows the add form in a modal, focused on the site field", () => {
      seedMember();
      renderStep5();
      openAddSite();

      expect(screen.getByRole("alertdialog", { name: /agregar sitio para ana/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^sitio$/i)).toHaveFocus();
    });

    it("cancelling the modal discards the draft without adding it", () => {
      seedMember();
      renderStep5();
      openAddSite();
      fillSite({ site: "Sin guardar" });
      fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();

      openAddSite();
      expect(screen.getByLabelText(/^sitio$/i)).toHaveValue("");
    });
  });
});
