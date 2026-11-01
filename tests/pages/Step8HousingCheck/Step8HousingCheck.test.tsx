import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Step8HousingCheck from "@pages/Step8HousingCheck/Step8HousingCheck";
import { HOUSING_CHECK_ITEMS } from "@pages/Step8HousingCheck/housingCheckItems";
import { WizardProvider } from "@wizard/WizardContext";

function renderStep8() {
  return render(
    <WizardProvider>
      <Step8HousingCheck />
    </WizardProvider>,
  );
}

afterEach(() => localStorage.clear());

function addHousingItem(item: string) {
  fireEvent.click(screen.getByRole("button", { name: /agregar ítem/i }));
  const dialog = screen.getByRole("alertdialog");
  fireEvent.change(within(dialog).getByLabelText(/^elemento$/i), { target: { value: item } });
  fireEvent.click(within(dialog).getByRole("button", { name: /^agregar$/i }));
}

describe("Step8HousingCheck", () => {
  it("starts with no items added, and offers all ~15 in 'Agregar ítem'", () => {
    renderStep8();
    expect(screen.getByText(/sin ítems agregados todavía/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /agregar ítem/i }));
    for (const item of HOUSING_CHECK_ITEMS) {
      expect(screen.getByRole("option", { name: item })).toBeInTheDocument();
    }
  });

  it("adds an item and shows it as its own row", () => {
    renderStep8();
    addHousingItem(HOUSING_CHECK_ITEMS[0]);
    expect(screen.getByText(HOUSING_CHECK_ITEMS[0])).toBeInTheDocument();
  });

  it("lets each added item record estado, reparaciones, plazo and responsable independently", () => {
    renderStep8();
    addHousingItem(HOUSING_CHECK_ITEMS[0]);
    addHousingItem(HOUSING_CHECK_ITEMS[1]);

    const firstRow = screen.getByText(HOUSING_CHECK_ITEMS[0]).closest("tr")!;
    const utils = within(firstRow);

    fireEvent.click(utils.getByLabelText(/bueno/i));
    fireEvent.change(utils.getByLabelText(/reparaciones necesarias/i), { target: { value: "Reforzar muro" } });
    fireEvent.change(utils.getByLabelText(/plazo/i), { target: { value: "2026-12-01" } });
    fireEvent.change(utils.getByLabelText(/responsable/i), { target: { value: "Ana Pérez" } });

    expect(utils.getByLabelText(/bueno/i)).toBeChecked();
    expect(utils.getByLabelText(/reparaciones necesarias/i)).toHaveValue("Reforzar muro");
    expect(utils.getByLabelText(/plazo/i)).toHaveValue("2026-12-01");
    expect(utils.getByLabelText(/responsable/i)).toHaveValue("Ana Pérez");

    const secondRow = screen.getByText(HOUSING_CHECK_ITEMS[1]).closest("tr")!;
    expect(within(secondRow).getByLabelText(/reparaciones necesarias/i)).toHaveValue("");
  });

  it("does not check both estado options for the same item at once", () => {
    renderStep8();
    addHousingItem(HOUSING_CHECK_ITEMS[0]);
    const row = screen.getByText(HOUSING_CHECK_ITEMS[0]).closest("tr")!;
    const utils = within(row);

    fireEvent.click(utils.getByLabelText(/bueno/i));
    fireEvent.click(utils.getByLabelText(/malo/i));

    expect(utils.getByLabelText(/bueno/i)).not.toBeChecked();
    expect(utils.getByLabelText(/malo/i)).toBeChecked();
  });

  it("removes an added item, returning it to the 'Agregar ítem' options", () => {
    renderStep8();
    addHousingItem(HOUSING_CHECK_ITEMS[0]);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(screen.queryByText(HOUSING_CHECK_ITEMS[0])).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /agregar ítem/i }));
    expect(screen.getByRole("option", { name: HOUSING_CHECK_ITEMS[0] })).toBeInTheDocument();
  });

  it("disables 'Agregar ítem' once every item has been added", () => {
    renderStep8();
    for (const item of HOUSING_CHECK_ITEMS) {
      addHousingItem(item);
    }
    expect(screen.getByRole("button", { name: /agregar ítem/i })).toBeDisabled();
  });
});
