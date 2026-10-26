import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddIconButton from "@components/AddIconButton/AddIconButton";

describe("AddIconButton", () => {
  it("exposes the label as the accessible name and as a tooltip", () => {
    render(<AddIconButton label="Agregar teléfono" onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Agregar teléfono" });
    expect(button).toHaveAttribute("title", "Agregar teléfono");
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<AddIconButton label="Agregar teléfono" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar teléfono" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
