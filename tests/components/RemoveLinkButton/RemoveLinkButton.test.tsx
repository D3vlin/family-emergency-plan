import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RemoveLinkButton from "@components/RemoveLinkButton/RemoveLinkButton";

describe("RemoveLinkButton", () => {
  it("defaults its label to 'Quitar'", () => {
    render(<RemoveLinkButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Quitar" })).toBeInTheDocument();
  });

  it("supports a custom label", () => {
    render(<RemoveLinkButton onClick={() => {}} label="Eliminar" />);
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<RemoveLinkButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
