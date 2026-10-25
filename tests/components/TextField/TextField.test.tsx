import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TextField from "@components/TextField/TextField";

describe("TextField", () => {
  it("renders a labeled input with the given value", () => {
    render(<TextField id="plan-name" label="Nombre del plan" value="Familia Perez" onChange={() => {}} />);
    expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue("Familia Perez");
  });

  it("calls onChange with the new value as the user types", () => {
    const onChange = vi.fn();
    render(<TextField id="plan-name" label="Nombre del plan" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/nombre del plan/i), { target: { value: "Calle 1" } });
    expect(onChange).toHaveBeenCalledWith("Calle 1");
  });

  it("marks the field as required by default, with aria-required and a visible marker", () => {
    render(<TextField id="plan-name" label="Nombre del plan" value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/nombre del plan/i)).toBeRequired();
    expect(screen.getByText(/nombre del plan/i)).toHaveClass("field-label-required");
  });

  it("can render as optional, without the required marker", () => {
    render(<TextField id="notes" label="Notas" value="" onChange={() => {}} required={false} />);
    expect(screen.getByLabelText(/notas/i)).not.toBeRequired();
    expect(screen.getByText(/notas/i)).not.toHaveClass("field-label-required");
  });

  it("applies the given maxLength", () => {
    render(<TextField id="plan-name" label="Nombre del plan" value="" onChange={() => {}} maxLength={150} />);
    expect(screen.getByLabelText(/nombre del plan/i)).toHaveAttribute("maxLength", "150");
  });
});
