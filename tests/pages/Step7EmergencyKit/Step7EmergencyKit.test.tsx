import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Step7EmergencyKit from "@pages/Step7EmergencyKit/Step7EmergencyKit";
import { COMPLEMENTARY_ITEMS, SURVIVAL_SUPPLIES } from "@pages/Step7EmergencyKit/emergencyKitItems";
import { WizardProvider } from "@wizard/WizardContext";

function renderStep7() {
  return render(
    <WizardProvider>
      <Step7EmergencyKit />
    </WizardProvider>,
  );
}

afterEach(() => localStorage.clear());

function addKitItem(listName: RegExp, item: string) {
  const fieldset = screen.getByRole("group", { name: listName });
  fireEvent.click(within(fieldset).getByRole("button", { name: /agregar ítem/i }));
  const dialog = screen.getByRole("alertdialog");
  fireEvent.change(within(dialog).getByLabelText(/^elemento$/i), { target: { value: item } });
  fireEvent.click(within(dialog).getByRole("button", { name: /^agregar$/i }));
}

describe("Step7EmergencyKit", () => {
  it("starts both lists empty", () => {
    renderStep7();
    expect(screen.getAllByText(/sin ítems agregados todavía/i)).toHaveLength(2);
  });

  it("adds an item to Suministros de supervivencia and shows it in that list's own table", () => {
    renderStep7();
    addKitItem(/suministros de supervivencia/i, SURVIVAL_SUPPLIES[0]);
    const fieldset = screen.getByRole("group", { name: /suministros de supervivencia/i });
    expect(within(fieldset).getByText(SURVIVAL_SUPPLIES[0])).toBeInTheDocument();
  });

  it("keeps each list's items independent from the other list", () => {
    renderStep7();
    addKitItem(/suministros de supervivencia/i, SURVIVAL_SUPPLIES[0]);
    const complementaryItemsGroup = screen.getByRole("group", { name: /documentos y elementos complementarios/i });
    expect(within(complementaryItemsGroup).queryByText(SURVIVAL_SUPPLIES[0])).not.toBeInTheDocument();
  });

  it("removes an added item, returning it to the 'Agregar ítem' options", () => {
    renderStep7();
    addKitItem(/suministros de supervivencia/i, SURVIVAL_SUPPLIES[0]);
    const fieldset = screen.getByRole("group", { name: /suministros de supervivencia/i });
    fireEvent.click(within(fieldset).getByRole("button", { name: /eliminar/i }));
    expect(within(fieldset).queryByText(SURVIVAL_SUPPLIES[0])).not.toBeInTheDocument();

    fireEvent.click(within(fieldset).getByRole("button", { name: /agregar ítem/i }));
    expect(screen.getByRole("option", { name: SURVIVAL_SUPPLIES[0] })).toBeInTheDocument();
  });

  it("disables 'Agregar ítem' once every item in that list has been added", () => {
    renderStep7();
    for (const item of COMPLEMENTARY_ITEMS) {
      addKitItem(/documentos y elementos complementarios/i, item);
    }
    const fieldset = screen.getByRole("group", { name: /documentos y elementos complementarios/i });
    expect(within(fieldset).getByRole("button", { name: /agregar ítem/i })).toBeDisabled();
  });
});
