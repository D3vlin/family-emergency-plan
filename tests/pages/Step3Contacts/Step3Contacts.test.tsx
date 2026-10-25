import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPlan } from "@storage/planStorage";
import { WizardProvider } from "@wizard/WizardContext";
import { MAX_CONTACTS, type Contact } from "@wizard/contact";
import Step3Contacts from "@pages/Step3Contacts/Step3Contacts";

function renderStep3() {
  return render(
    <WizardProvider>
      <Step3Contacts />
    </WizardProvider>,
  );
}

function fillContact(name: string, phone: string) {
  fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/^teléfono$/i), { target: { value: phone } });
}

afterEach(() => localStorage.clear());

describe("Step3Contacts", () => {
  it("shows the empty state, not a table, when there are no contacts", () => {
    renderStep3();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/sin contactos adicionales/i)).toBeInTheDocument();
  });

  it("adds a contact with name, phone and an optional relationship", () => {
    renderStep3();
    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    fillContact("Ana", "300 123 4567");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "300 123 4567" })).toBeInTheDocument();
  });

  it("keeps Guardar disabled until name and phone are both filled", () => {
    renderStep3();
    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();

    fillContact("Ana", "300 123 4567");
    expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled();
  });

  it("strips letters out of the phone field as they're typed, instead of accepting and rejecting them on save", () => {
    renderStep3();
    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    fillContact("Ana", "abc1234");
    expect(screen.getByLabelText(/^teléfono$/i)).toHaveValue("1234");
  });

  it("blocks saving a phone with no digits at all ('+'/'-' alone would otherwise slip through)", () => {
    renderStep3();
    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    fillContact("Ana", "+--");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/formato inválido/i);
  });

  it("warns (without blocking) on a duplicate phone, normalized", () => {
    renderStep3();
    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    fillContact("Ana", "300 123 4567");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    fillContact("Luis", "3001234567"); // same number, no spaces
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/ya está registrado/i);
    // Saved as typed, just displayed with 3-3-4 grouping — check the actual
    // stored value, not only the rendered text, to prove storage itself
    // was never normalized.
    const luisRow = screen.getByRole("cell", { name: "Luis" }).closest("tr")!;
    expect(within(luisRow).getByRole("cell", { name: "300 123 4567" })).toBeInTheDocument();
    const stored = loadPlan()!.data.contacts as Contact[];
    expect(stored.find((c) => c.name === "Luis")?.phone).toBe("3001234567");
  });

  it("deletes a contact after confirmation", () => {
    renderStep3();
    fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
    fillContact("Ana", "300 123 4567");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    const anaRow = screen.getByRole("cell", { name: "Ana" }).closest("tr")!;
    fireEvent.click(within(anaRow).getByRole("button", { name: /eliminar/i }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /eliminar/i }));

    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
  });

  it("allows an empty contact list without blocking the step", () => {
    renderStep3();
    expect(screen.queryByTestId("contact-edit-row")).not.toBeInTheDocument();
    expect(screen.getByText(/sin contactos adicionales agregados todavía/i)).toBeInTheDocument();
  });

  it("disables 'Agregar contacto' once the limit of 20 is reached", () => {
    renderStep3();
    for (let i = 0; i < MAX_CONTACTS; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
      fillContact(`Contacto ${i}`, "300 123 4567");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    }
    const addButton = screen.getByRole("button", { name: /agregar contacto/i });
    expect(addButton).toBeDisabled();
  });

  describe("table + modal, deferred persistence", () => {
    it("shows the add form in a modal, focused on the first field", () => {
      renderStep3();
      fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));

      expect(screen.getByRole("alertdialog", { name: /agregar contacto/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^nombre$/i)).toHaveFocus();
    });

    it("disables 'Agregar contacto' and other rows' 'Editar' while a contact is being edited", () => {
      renderStep3();
      fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
      fillContact("Ana", "300 123 4567");
      fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

      fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));

      expect(screen.getByRole("button", { name: /agregar contacto/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /editar/i })).toBeDisabled();
    });

    it("leaves no stray entry in storage if the page is navigated away from (unmounted) mid-add", () => {
      const { unmount } = renderStep3();
      fireEvent.click(screen.getByRole("button", { name: /agregar contacto/i }));
      fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Sin guardar" } });

      unmount();

      const stored = loadPlan()?.data.contacts as Contact[] | undefined;
      expect(stored ?? []).toHaveLength(0);
    });
  });
});
