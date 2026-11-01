import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Step9Pets from "@pages/Step9Pets/Step9Pets";
import { PET_KIT_ITEMS } from "@pages/Step9Pets/petKitItems";
import { loadPlan } from "@storage/planStorage";
import { WizardProvider } from "@wizard/WizardContext";
import type { Pet } from "@wizard/pet";

function renderStep9() {
  return render(
    <WizardProvider>
      <Step9Pets />
    </WizardProvider>,
  );
}

afterEach(() => localStorage.clear());

function addPet(name: string, species: string) {
  fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
  const row = screen.getByTestId("pet-edit-row");
  fireEvent.change(within(row).getByLabelText(/^nombre$/i), { target: { value: name } });
  fireEvent.change(within(row).getByLabelText(/especie/i), { target: { value: species } });
  fireEvent.click(within(row).getByRole("button", { name: /guardar/i }));
}

function addKitItem(row: HTMLElement, item: string) {
  fireEvent.click(within(row).getByRole("button", { name: /agregar ítem/i }));
  fireEvent.change(within(row).getByLabelText(/^elemento$/i), { target: { value: item } });
  fireEvent.click(within(row).getByRole("button", { name: /^agregar$/i }));
}

describe("Step9Pets", () => {
  it("adds a pet with name and species and shows it in the list", () => {
    renderStep9();
    addPet("Firulais", "Perro");
    expect(screen.getByText(/firulais/i)).toBeInTheDocument();
  });

  it("saves a pet with only the required fields", () => {
    renderStep9();
    addPet("Michi", "Gato");
    expect(screen.queryByTestId("pet-edit-row")).not.toBeInTheDocument();
    expect(screen.getByText(/michi/i)).toBeInTheDocument();
  });

  it("keeps Guardar disabled while species is left empty", () => {
    renderStep9();
    fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
    const row = screen.getByTestId("pet-edit-row");
    fireEvent.change(within(row).getByLabelText(/^nombre$/i), { target: { value: "Firulais" } });
    expect(within(row).getByRole("button", { name: /guardar/i })).toBeDisabled();

    fireEvent.change(within(row).getByLabelText(/especie/i), { target: { value: "Perro" } });
    expect(within(row).getByRole("button", { name: /guardar/i })).toBeEnabled();
  });

  it("cancelling a newly-added pet removes it instead of saving an empty entry", () => {
    renderStep9();
    fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByTestId("pet-edit-row")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/sin mascotas agregadas todavía/i)).toBeInTheDocument();
  });

  it("asks for confirmation before deleting a pet", () => {
    renderStep9();
    addPet("Firulais", "Perro");
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/firulais/i);
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /eliminar/i }));
    expect(screen.queryByText(/firulais/i)).not.toBeInTheDocument();
  });

  it("strips letters out of the vet-phone field as they're typed", () => {
    renderStep9();
    fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
    const row = screen.getByTestId("pet-edit-row");
    fireEvent.change(within(row).getByLabelText(/teléfono del veterinario/i), { target: { value: "abc1234" } });
    expect(within(row).getByLabelText(/teléfono del veterinario/i)).toHaveValue("1234");
  });

  it("validates vet/caretaker phone format", () => {
    renderStep9();
    fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
    const row = screen.getByTestId("pet-edit-row");
    fireEvent.change(within(row).getByLabelText(/^nombre$/i), { target: { value: "Firulais" } });
    fireEvent.change(within(row).getByLabelText(/especie/i), { target: { value: "Perro" } });
    fireEvent.change(within(row).getByLabelText(/teléfono del veterinario/i), { target: { value: "+--" } });
    fireEvent.click(within(row).getByRole("button", { name: /guardar/i }));
    expect(within(row).getByRole("alert")).toBeInTheDocument();

    fireEvent.change(within(row).getByLabelText(/teléfono del veterinario/i), { target: { value: "300 123 4567" } });
    fireEvent.click(within(row).getByRole("button", { name: /guardar/i }));
    expect(screen.queryByTestId("pet-edit-row")).not.toBeInTheDocument();
  });

  it("disables adding past the 20-pet limit", () => {
    renderStep9();
    for (let i = 0; i < 20; i += 1) {
      addPet(`Mascota ${i}`, "Especie");
    }
    const addButton = screen.getByRole("button", { name: /agregar mascota/i });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute("title", expect.stringContaining("20"));
  }, 15000);

  it("lets the kit checklist stay fully empty", () => {
    renderStep9();
    addPet("Firulais", "Perro");
    expect(screen.queryByTestId("pet-edit-row")).not.toBeInTheDocument();
  });

  it("warns, non-blockingly, when a kit item is added without an expiry/notes value", () => {
    renderStep9();
    addPet("Firulais", "Perro");
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    const row = screen.getByTestId("pet-edit-row");
    fireEvent.click(within(row).getByLabelText(/tienen kit de emergencia armado/i));
    addKitItem(row, PET_KIT_ITEMS[11]);
    fireEvent.click(within(row).getByRole("button", { name: /^guardar$/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/fecha de vencimiento|observaciones/i);
  });

  it("hides 'Agregar ítem' until the general 'tienen kit' gate is checked, and clears the list when unchecked", () => {
    renderStep9();
    fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
    const row = screen.getByTestId("pet-edit-row");
    expect(within(row).queryByRole("button", { name: /agregar ítem/i })).not.toBeInTheDocument();

    const hasKitToggle = within(row).getByLabelText(/tienen kit de emergencia armado/i);
    fireEvent.click(hasKitToggle);
    expect(within(row).getByText(/sin ítems agregados todavía/i)).toBeInTheDocument();
    addKitItem(row, PET_KIT_ITEMS[0]);
    expect(within(row).getByText(PET_KIT_ITEMS[0])).toBeInTheDocument();

    fireEvent.click(hasKitToggle);
    expect(within(row).queryByText(PET_KIT_ITEMS[0])).not.toBeInTheDocument();
    fireEvent.click(hasKitToggle);
    expect(within(row).getByText(/sin ítems agregados todavía/i)).toBeInTheDocument();
  });

  it("marking 'no aplica' with no pets lets the step stay valid without a list", () => {
    renderStep9();
    fireEvent.click(screen.getByLabelText(/no aplica.*mascota/i));
    expect(screen.queryByRole("button", { name: /agregar mascota/i })).not.toBeInTheDocument();
  });

  it("marking 'no aplica' with existing pets asks for confirmation before clearing", () => {
    renderStep9();
    addPet("Firulais", "Perro");
    fireEvent.click(screen.getByLabelText(/no aplica.*mascota/i));
    expect(screen.getByRole("alertdialog", { name: /confirmar que no aplica/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(screen.queryByText(/firulais/i)).not.toBeInTheDocument();
    expect(loadPlan()!.data.pets).toEqual([]);
  });

  it("cancelling the 'no aplica' confirmation keeps data intact and unchecks the control", () => {
    renderStep9();
    addPet("Firulais", "Perro");
    fireEvent.click(screen.getByLabelText(/no aplica.*mascota/i));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.getByLabelText(/no aplica.*mascota/i)).not.toBeChecked();
    expect(screen.getByText(/firulais/i)).toBeInTheDocument();
  });

  describe("table + modal, deferred persistence", () => {
    it("shows the add form in a modal, focused on the first field", () => {
      renderStep9();
      fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar mascota/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^nombre$/i)).toHaveFocus();
    });

    it("disables 'Agregar mascota' and other rows' 'Editar' while a pet is being edited", () => {
      renderStep9();
      addPet("Firulais", "Perro");

      fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));

      expect(screen.getByRole("button", { name: /agregar mascota/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /editar/i })).toBeDisabled();
    });

    it("leaves no stray entry in storage if the page is navigated away from (unmounted) mid-add", () => {
      const { unmount } = renderStep9();
      fireEvent.click(screen.getByRole("button", { name: /agregar mascota/i }));
      fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Sin guardar" } });

      unmount();

      const stored = loadPlan()?.data.pets as Pet[] | undefined;
      expect(stored ?? []).toHaveLength(0);
    });
  });
});
