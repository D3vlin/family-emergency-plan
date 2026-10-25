import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPlan, savePlan } from "@storage/planStorage";
import { WizardProvider } from "@wizard/WizardContext";
import Step2FamilyMembers from "@pages/Step2FamilyMembers/Step2FamilyMembers";
import { createEmptyMember, MAX_FAMILY_MEMBERS, type FamilyMember } from "@wizard/familyMember";

function renderStep2() {
  return render(
    <WizardProvider>
      <Step2FamilyMembers />
    </WizardProvider>,
  );
}

function fillRequiredFields(name: string, documentNumber: string) {
  fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/tipo de documento/i), { target: { value: "Cédula de Ciudadanía" } });
  fireEvent.change(screen.getByLabelText(/^identificación$/i), { target: { value: documentNumber } });
  fireEvent.change(screen.getByLabelText(/^edad$/i), { target: { value: "30" } });
}

afterEach(() => localStorage.clear());

describe("Step2FamilyMembers", () => {
  it("adds a member with only the required fields", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fillRequiredFields("Ana", "123");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });

  it("keeps Guardar disabled until the required fields are filled, same as Step 1's Siguiente", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();

    fillRequiredFields("Ana", "123");
    expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled();
  });

  it("keeps Guardar disabled while edad is left empty — edad is required too", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/tipo de documento/i), { target: { value: "Cédula de Ciudadanía" } });
    fireEvent.change(screen.getByLabelText(/^identificación$/i), { target: { value: "123" } });
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^edad$/i), { target: { value: "30" } });
    expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled();
  });

  it("'Menor de 1 año' satisfies the edad requirement without typing a number", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Bebé" } });
    fireEvent.change(screen.getByLabelText(/tipo de documento/i), { target: { value: "Cédula de Ciudadanía" } });
    fireEvent.change(screen.getByLabelText(/^identificación$/i), { target: { value: "999" } });
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/menor de 1 año/i));
    expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled();
  });

  it("blocks a duplicate identity (normalized tipo+número), with the error attached to the Identificación field itself", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fillRequiredFields("Ana", "123");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fillRequiredFields("Otro", "1 2 3"); // same number, different spacing
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/ya existe otro integrante/i);
    expect(screen.getByLabelText(/^identificación$/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^nombre$/i)).not.toHaveAttribute("aria-invalid");
  });

  it("allows adding illnesses, medications, and linking a medication to an illness", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fillRequiredFields("Ana", "123");

    fireEvent.click(screen.getByRole("button", { name: /agregar enfermedad/i }));
    fireEvent.change(screen.getByLabelText(/nueva enfermedad/i), { target: { value: "Asma" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

    fireEvent.click(screen.getByRole("button", { name: /agregar medicamento/i }));
    fireEvent.change(screen.getByLabelText(/nombre del medicamento/i), { target: { value: "Ventolin" } });
    fireEvent.change(screen.getByLabelText(/^dosis$/i), { target: { value: "2 puff" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /asma/i }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });

  it("warns before unlinking an illness from its medications, without deleting the medication", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fillRequiredFields("Ana", "123");
    fireEvent.click(screen.getByRole("button", { name: /agregar enfermedad/i }));
    fireEvent.change(screen.getByLabelText(/nueva enfermedad/i), { target: { value: "Asma" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    fireEvent.click(screen.getByRole("button", { name: /agregar medicamento/i }));
    fireEvent.change(screen.getByLabelText(/nombre del medicamento/i), { target: { value: "Ventolin" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /asma/i }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

    const illnessesGroup = screen.getByRole("group", { name: /^enfermedades$/i });
    fireEvent.click(within(illnessesGroup).getByRole("button", { name: /quitar/i }));

    expect(screen.getByRole("alertdialog", { name: /confirmar eliminación de enfermedad/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(screen.queryByText("Asma")).not.toBeInTheDocument();
    expect(screen.getByText(/Ventolin/)).toBeInTheDocument(); // medication stays, just unlinked
  });

  it("asks for confirmation before deleting a member, with a summary", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fillRequiredFields("Ana", "123");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    const dialog = screen.getByRole("alertdialog", { name: /eliminar a ana/i });
    expect(within(dialog).getByText(/único integrante/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /^eliminar$/i }));
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
  });

  it("shows real non-zero counts in the cascade-delete confirmation and removes that data too", () => {
    const member: FamilyMember = {
      ...createEmptyMember("m1"),
      name: "Ana",
      documentType: "Cédula de Ciudadanía",
      documentNumber: "123",
      frequentSites: [{ id: "s1", site: "Colegio", contactPerson: "Luis", contactPhone: "300 123 4567" }],
      disabilities: [{ id: "d1", type: "Visual" }],
    };
    const other: FamilyMember = { ...createEmptyMember("m2"), name: "Otro", documentType: "Cédula de Ciudadanía", documentNumber: "456" };
    savePlan({ data: { familyMembers: [member, other] }, lastVisitedPath: "/step/2", lastActivityAt: Date.now() });
    renderStep2();

    const anaRow = screen.getByRole("cell", { name: "Ana" }).closest("tr")!;
    fireEvent.click(within(anaRow).getByRole("button", { name: /eliminar/i }));

    const dialog = screen.getByRole("alertdialog", { name: /eliminar a ana/i });
    expect(within(dialog).getByText(/1 sitio\(s\) frecuente\(s\)/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/1 discapacidad\(es\)/i)).toBeInTheDocument();
    // Not the only member, so no "lista quedará vacía" warning expected here.
    expect(within(dialog).queryByText(/único integrante/i)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /^eliminar$/i }));

    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    const stored = loadPlan()!.data.familyMembers as FamilyMember[];
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Otro");
  });

  it("cancelling the edit of a freshly-added member discards the draft, leaving no row behind", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(screen.queryByTestId("member-edit-row")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/sin integrantes agregados todavía/i)).toBeInTheDocument();
  });

  it("disables 'Agregar integrante' once the limit of 20 is reached", () => {
    renderStep2();
    for (let i = 0; i < MAX_FAMILY_MEMBERS; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields(`Persona ${i}`, `${i}`);
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    }

    const addButton = screen.getByRole("button", { name: /agregar integrante/i });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute("title", expect.stringMatching(/límite de 20/i));
  });

  describe("numeric-only fields", () => {
    it("strips letters typed into Identificación, keeping only digits", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.change(screen.getByLabelText(/^identificación$/i), { target: { value: "ab12cd34" } });
      expect(screen.getByLabelText(/^identificación$/i)).toHaveValue("1234");
    });

    it("strips letters typed into Edad, keeping only digits", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.change(screen.getByLabelText(/^edad$/i), { target: { value: "3x5y" } });
      expect(screen.getByLabelText(/^edad$/i)).toHaveValue("35");
    });

    it("'Menor de 1 año' disables the numeric Edad field and saves the special value", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields("Bebé", "999");
      fireEvent.click(screen.getByLabelText(/menor de 1 año/i));

      expect(screen.getByLabelText(/^edad$/i)).toBeDisabled();
      expect(screen.getByLabelText(/^edad$/i)).toHaveValue("");

      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
      const stored = loadPlan()!.data.familyMembers as FamilyMember[];
      expect(stored[0].age).toBe("Menor de 1 año");
    });

    it("unchecking 'Menor de 1 año' re-enables Edad and clears the special value", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByLabelText(/menor de 1 año/i));
      fireEvent.click(screen.getByLabelText(/menor de 1 año/i));

      expect(screen.getByLabelText(/^edad$/i)).toBeEnabled();
      expect(screen.getByLabelText(/^edad$/i)).toHaveValue("");
    });
  });

  it("caps free-text fields at a fixed length (e.g. Nombre)", () => {
    renderStep2();
    fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
    expect(screen.getByLabelText(/^nombre$/i)).toHaveAttribute("maxLength");
  });

  describe("preventing data loss while an edit is in progress", () => {
    it("disables 'Agregar integrante' while a member is being edited", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      const addButton = screen.getByRole("button", { name: /agregar integrante/i });
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveAttribute("title", expect.stringMatching(/guardá o cancelá/i));
    });

    it("disables 'Editar' on other members while one is being edited, without discarding anything typed", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields("Ana", "123");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Sin terminar" } });

      const anaEditButton = screen.getByRole("button", { name: /editar/i });
      expect(anaEditButton).toBeDisabled();

      fireEvent.click(anaEditButton); // disabled: must be a no-op
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Sin terminar");

      const stored = loadPlan()!.data.familyMembers as FamilyMember[];
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Ana");
    });

    it("re-enables 'Agregar integrante' and 'Editar' after saving the current edit", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields("Ana", "123");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      expect(screen.getByRole("button", { name: /agregar integrante/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /editar/i })).toBeEnabled();
    });

    it("re-enables 'Agregar integrante' after cancelling the current edit", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

      expect(screen.getByRole("button", { name: /agregar integrante/i })).toBeEnabled();
    });
  });

  describe("new member drafts never touch planData until saved", () => {
    it("leaves no stray entry in storage if the page is navigated away from (unmounted) mid-add", () => {
      const { unmount } = renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Sin guardar" } });

      unmount();

      const stored = loadPlan()?.data.familyMembers as FamilyMember[] | undefined;
      expect(stored ?? []).toHaveLength(0);
    });

    it("still lets an existing, already-saved member be re-edited and its changes persisted", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields("Ana", "123");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      fireEvent.click(screen.getByRole("button", { name: /editar/i }));
      fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Ana María" } });
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      expect(screen.getByRole("cell", { name: "Ana María" })).toBeInTheDocument();
    });
  });

  describe("table + modal design", () => {
    it("shows the add form in a modal, focused on the first field", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar integrante/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^nombre$/i)).toHaveFocus();
    });

    it("shows the edit form in a modal labelled with the member's name", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields("Ana", "123");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      fireEvent.click(screen.getByRole("button", { name: /editar/i }));

      expect(screen.getByRole("alertdialog", { name: /editar a ana/i })).toBeInTheDocument();
    });

    it("shows Nombre, Documento, Parentesco, Edad and Acciones as the table columns", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fillRequiredFields("Ana", "123");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
      expect(headers).toEqual(["Nombre", "Documento", "Parentesco", "Edad", "Acciones"]);
    });
  });

  describe("MemberEditRow's phone/illness/medication tables", () => {
    it("shows an empty-state message, not a table, when there are no phones/illnesses/medications yet", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      expect(screen.getByText(/sin teléfonos agregados todavía/i)).toBeInTheDocument();
      expect(screen.getByText(/sin enfermedades agregadas todavía/i)).toBeInTheDocument();
      expect(screen.getByText(/sin medicamentos agregados todavía/i)).toBeInTheDocument();
    });

    it("shows an added phone as a table row with Número and Acciones columns", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByRole("button", { name: /agregar teléfono/i }));
      fireEvent.change(screen.getByLabelText(/nuevo teléfono/i), { target: { value: "300 123 4567" } });
      fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

      expect(screen.getByRole("cell", { name: "300 123 4567" })).toBeInTheDocument();
      expect(screen.queryByText(/sin teléfonos agregados todavía/i)).not.toBeInTheDocument();
    });

    it("shows a medication's linked illnesses as a comma-separated column, '—' when none linked", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      fireEvent.click(screen.getByRole("button", { name: /agregar enfermedad/i }));
      fireEvent.change(screen.getByLabelText(/nueva enfermedad/i), { target: { value: "Asma" } });
      fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

      fireEvent.click(screen.getByRole("button", { name: /agregar medicamento/i }));
      fireEvent.change(screen.getByLabelText(/nombre del medicamento/i), { target: { value: "Ventolin" } });
      fireEvent.click(screen.getByRole("checkbox", { name: /asma/i }));
      fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

      fireEvent.click(screen.getByRole("button", { name: /agregar medicamento/i }));
      fireEvent.change(screen.getByLabelText(/nombre del medicamento/i), { target: { value: "Paracetamol" } });
      fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

      const ventolinRow = screen.getByRole("cell", { name: "Ventolin" }).closest("tr")!;
      expect(within(ventolinRow).getByRole("cell", { name: "Asma" })).toBeInTheDocument();

      const paracetamolRow = screen.getByRole("cell", { name: "Paracetamol" }).closest("tr")!;
      const paracetamolCells = within(paracetamolRow).getAllByRole("cell");
      expect(paracetamolCells[2]).toHaveTextContent("—"); // Enfermedades vinculadas
    });
  });

  describe("Teléfonos/Enfermedades/Medicamentos open their add form in a nested modal", () => {
    it("opens 'Agregar enfermedad' as a modal, focused on the field, separate from the member modal", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      expect(screen.queryByLabelText(/nueva enfermedad/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /agregar enfermedad/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar enfermedad/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nueva enfermedad/i)).toHaveFocus();
      expect(screen.getByRole("alertdialog", { name: /agregar integrante/i })).toBeInTheDocument();
    });

    it("opens 'Agregar medicamento' as a modal, focused on the field", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByRole("button", { name: /agregar medicamento/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar medicamento/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre del medicamento/i)).toHaveFocus();
    });

    it("clears the typed illness name when the add-enfermedad modal is cancelled", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByRole("button", { name: /agregar enfermedad/i }));
      fireEvent.change(screen.getByLabelText(/nueva enfermedad/i), { target: { value: "Sin guardar" } });

      const addIllnessModal = screen.getByRole("alertdialog", { name: /agregar enfermedad/i });
      fireEvent.click(within(addIllnessModal).getByRole("button", { name: /cancelar/i }));

      expect(screen.queryByRole("alertdialog", { name: /agregar enfermedad/i })).not.toBeInTheDocument();
      expect(screen.queryByText("Sin guardar")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /agregar enfermedad/i }));
      expect(screen.getByLabelText(/nueva enfermedad/i)).toHaveValue("");
    });

    it("opens 'Agregar teléfono' as a modal, focused on the field", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      expect(screen.queryByLabelText(/nuevo teléfono/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /agregar teléfono/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar teléfono/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nuevo teléfono/i)).toHaveFocus();
    });

    it("shows the phone-format error inside the nested modal, not the member-level banner", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByRole("button", { name: /agregar teléfono/i }));
      fireEvent.change(screen.getByLabelText(/nuevo teléfono/i), { target: { value: "+--" } });

      const addPhoneModal = screen.getByRole("alertdialog", { name: /agregar teléfono/i });
      fireEvent.click(within(addPhoneModal).getByRole("button", { name: "Agregar" }));

      expect(within(addPhoneModal).getByRole("alert")).toHaveTextContent(/formato inválido/i);
      expect(screen.getAllByRole("alert")).toHaveLength(1);
    });

    it("strips letters out of the phone field as they're typed", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));
      fireEvent.click(screen.getByRole("button", { name: /agregar teléfono/i }));
      fireEvent.change(screen.getByLabelText(/nuevo teléfono/i), { target: { value: "abc1234" } });
      expect(screen.getByLabelText(/nuevo teléfono/i)).toHaveValue("1234");
    });

    it("each add-trigger button has an accessible name even though it shows only an icon", () => {
      renderStep2();
      fireEvent.click(screen.getByRole("button", { name: /agregar integrante/i }));

      expect(screen.getByRole("button", { name: "Agregar teléfono" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Agregar enfermedad" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Agregar medicamento" })).toBeInTheDocument();
    });
  });
});
