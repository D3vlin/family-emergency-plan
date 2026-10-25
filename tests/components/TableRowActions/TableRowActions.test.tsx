import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TableRowActions from "@components/TableRowActions/TableRowActions";

describe("TableRowActions", () => {
  it("calls onEdit and onDelete from their own buttons", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TableRowActions onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables Editar with the given title when editDisabled is set", () => {
    render(
      <TableRowActions
        onEdit={() => {}}
        onDelete={() => {}}
        editDisabled
        editDisabledTitle="Guardá o cancelá la edición actual antes de continuar."
      />,
    );
    const editButton = screen.getByRole("button", { name: /editar/i });
    expect(editButton).toBeDisabled();
    expect(editButton).toHaveAttribute("title", "Guardá o cancelá la edición actual antes de continuar.");
  });

  it("leaves Eliminar enabled even while Editar is disabled", () => {
    render(<TableRowActions onEdit={() => {}} onDelete={() => {}} editDisabled />);
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeEnabled();
  });
});
