import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RemoveButton from "@components/RemoveButton/RemoveButton";

describe("RemoveButton", () => {
  it("defaults its label to 'Eliminar'", () => {
    render(<RemoveButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });

  it("supports a custom label", () => {
    render(<RemoveButton onClick={() => {}} label="Quitar sitio" />);
    expect(screen.getByRole("button", { name: "Quitar sitio" })).toBeInTheDocument();
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<RemoveButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
