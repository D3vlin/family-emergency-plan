import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SelectField from "@components/SelectField/SelectField";

const OPTIONS = ["Cédula de Ciudadanía", "Tarjeta de Identidad", "Registro Civil"];

describe("SelectField", () => {
  it("renders a labeled select with the placeholder as the empty option", () => {
    render(
      <SelectField
        id="doc-type"
        label="Tipo de documento"
        options={OPTIONS}
        placeholder="Seleccioná un tipo"
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/tipo de documento/i)).toHaveValue("");
    expect(screen.getByRole("option", { name: "Seleccioná un tipo" })).toBeInTheDocument();
  });

  it("lists every option, and reflects the selected value", () => {
    render(
      <SelectField
        id="doc-type"
        label="Tipo de documento"
        options={OPTIONS}
        placeholder="Seleccioná un tipo"
        value="Registro Civil"
        onChange={() => {}}
      />,
    );
    for (const option of OPTIONS) {
      expect(screen.getByRole("option", { name: option })).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/tipo de documento/i)).toHaveValue("Registro Civil");
  });

  it("calls onChange with the selected option", () => {
    const onChange = vi.fn();
    render(
      <SelectField
        id="doc-type"
        label="Tipo de documento"
        options={OPTIONS}
        placeholder="Seleccioná un tipo"
        value=""
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/tipo de documento/i), { target: { value: "Tarjeta de Identidad" } });
    expect(onChange).toHaveBeenCalledWith("Tarjeta de Identidad");
  });

  it("marks the field as required by default, with aria-required and a visible marker", () => {
    render(
      <SelectField
        id="doc-type"
        label="Tipo de documento"
        options={OPTIONS}
        placeholder="Seleccioná un tipo"
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/tipo de documento/i)).toBeRequired();
    expect(screen.getByText(/tipo de documento/i)).toHaveClass("field-label-required");
  });

  it("shows a field-level error as an alert, marking the select invalid", () => {
    render(
      <SelectField
        id="doc-type"
        label="Tipo de documento"
        options={OPTIONS}
        placeholder="Seleccioná un tipo"
        value=""
        onChange={() => {}}
        error="Seleccioná un tipo de documento."
      />,
    );
    const select = screen.getByLabelText(/tipo de documento/i);
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveClass("field-input-invalid");
    expect(screen.getByRole("alert")).toHaveTextContent("Seleccioná un tipo de documento.");
  });
});
