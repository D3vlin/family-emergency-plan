import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Step4Disabilities from "@pages/Step4Disabilities/Step4Disabilities";
import { loadPlan, savePlan } from "@storage/planStorage";
import { createEmptyMember, DISABILITY_TYPES, type FamilyMember } from "@wizard/familyMember";
import { WizardProvider } from "@wizard/WizardContext";

function seedMember(overrides: Partial<ReturnType<typeof createEmptyMember>> = {}) {
  const member = { ...createEmptyMember("m1"), name: "Ana", documentType: "Cédula de Ciudadanía", documentNumber: "1", ...overrides };
  savePlan({ data: { familyMembers: [member] }, lastVisitedPath: "/step/4", lastActivityAt: Date.now() });
  return member;
}

function renderStep4() {
  return render(
    <WizardProvider>
      <Step4Disabilities />
    </WizardProvider>,
  );
}

function addDisability(type: string) {
  fireEvent.click(screen.getByRole("button", { name: /agregar discapacidad/i }));
  fireEvent.change(screen.getByLabelText(/tipo de discapacidad/i), { target: { value: type } });
  fireEvent.click(screen.getByRole("button", { name: /^agregar$/i }));
}

afterEach(() => localStorage.clear());

describe("Step4Disabilities", () => {
  it("lists existing family members, not an independent list", () => {
    seedMember();
    renderStep4();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("adds a disability to a member and requires life-support once one exists", () => {
    seedMember();
    renderStep4();

    addDisability("Visual");

    expect(within(screen.getByRole("table")).getByText("Visual")).toBeInTheDocument();
    expect(screen.getByLabelText(/requiere soporte vital/i)).toBeInTheDocument();
  });

  it("marks 'requiere soporte vital' as required with an asterisk only, no error box", () => {
    seedMember();
    renderStep4();
    addDisability("Visual");

    const select = screen.getByLabelText(/requiere soporte vital/i);
    expect(select).toHaveAttribute("aria-required", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(select).not.toHaveAttribute("aria-invalid");
  });

  it("allows more than one disability per member, accumulated in a sublist", () => {
    seedMember();
    renderStep4();

    addDisability("Visual");
    addDisability("Motriz");

    const table = screen.getByRole("table");
    expect(within(table).getByText("Visual")).toBeInTheDocument();
    expect(within(table).getByText("Motriz")).toBeInTheDocument();
  });

  it("drops an already-registered type from the Agregar dropdown, and brings it back once removed", () => {
    seedMember();
    renderStep4();

    addDisability("Visual");
    fireEvent.click(screen.getByRole("button", { name: /agregar discapacidad/i }));
    expect(screen.queryByRole("option", { name: "Visual" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    fireEvent.click(within(screen.getByRole("table")).getByRole("button", { name: /eliminar/i }));
    fireEvent.click(screen.getByRole("button", { name: /agregar discapacidad/i }));
    expect(screen.getByRole("option", { name: "Visual" })).toBeInTheDocument();
  });

  it("offers 'Otro' for soporte vital with a free-text field to specify", () => {
    seedMember();
    renderStep4();
    addDisability("Visual");

    fireEvent.change(screen.getByLabelText(/requiere soporte vital/i), { target: { value: "Otro" } });
    const otherInput = screen.getByLabelText(/^especificá$/i);
    fireEvent.change(otherInput, { target: { value: "Silla de ruedas eléctrica" } });

    const stored = loadPlan()!.data.familyMembers as FamilyMember[];
    expect(stored[0].requiresLifeSupport).toBe("Silla de ruedas eléctrica");
  });

  it("marking 'no aplica' with no data hides the form immediately", () => {
    seedMember();
    renderStep4();
    fireEvent.click(screen.getByLabelText(/no aplica/i));
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("marking 'no aplica' with existing disabilities asks for confirmation and clears them", () => {
    const member = seedMember({ disabilities: [{ id: "d1", type: "Visual" }], requiresLifeSupport: "No requiere" });
    savePlan({ data: { familyMembers: [member] }, lastVisitedPath: "/step/4", lastActivityAt: Date.now() });
    renderStep4();

    fireEvent.click(screen.getByLabelText(/no aplica/i));
    const dialog = screen.getByRole("alertdialog", { name: /confirmar que no aplica/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /confirmar/i }));

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    const stored = loadPlan()!.data.familyMembers as FamilyMember[];
    expect(stored[0].disabilities).toEqual([]);
    expect(stored[0].requiresLifeSupport).toBe("");
  });

  it("disables 'Agregar discapacidad' once the limit of 20 is reached", () => {
    const manyDisabilities = Array.from({ length: 20 }, (_, i) => ({
      id: `d${i}`,
      type: DISABILITY_TYPES[i % DISABILITY_TYPES.length],
    }));
    seedMember({ disabilities: manyDisabilities, requiresLifeSupport: "No requiere" });
    renderStep4();

    const addButton = screen.getByRole("button", { name: /agregar discapacidad/i });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute("title", expect.stringMatching(/límite de 20/i));
  });

  describe("table + modal", () => {
    it("shows the add form in a modal, focused on the type select", () => {
      seedMember();
      renderStep4();
      fireEvent.click(screen.getByRole("button", { name: /agregar discapacidad/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar discapacidad para ana/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo de discapacidad/i)).toHaveFocus();
    });

    it("cancelling the modal discards the selected type without adding it", () => {
      seedMember();
      renderStep4();
      fireEvent.click(screen.getByRole("button", { name: /agregar discapacidad/i }));
      fireEvent.change(screen.getByLabelText(/tipo de discapacidad/i), { target: { value: "Visual" } });
      fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });
});
