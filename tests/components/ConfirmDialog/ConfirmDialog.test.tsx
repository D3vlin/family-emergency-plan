import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "@components/ConfirmDialog/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders Cancelar/Confirmar by default, focused on Cancelar", () => {
    render(
      <ConfirmDialog ariaLabel="Confirmar algo" onCancel={() => {}} onConfirm={() => {}}>
        <p>¿Seguro?</p>
      </ConfirmDialog>,
    );
    expect(screen.getByRole("alertdialog", { name: /confirmar algo/i })).toHaveTextContent("¿Seguro?");
    const cancelButton = screen.getByRole("button", { name: /^cancelar$/i });
    expect(cancelButton).toHaveFocus();
    expect(screen.getByRole("button", { name: /^confirmar$/i })).toBeInTheDocument();
  });

  it("supports a custom confirm label (e.g. 'Eliminar') and calls the right handler per button", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog ariaLabel="Eliminar algo" onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Eliminar">
        <p>¿Eliminar?</p>
      </ConfirmDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^eliminar$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
