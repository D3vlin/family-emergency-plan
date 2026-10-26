import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";

describe("ModalFormActions", () => {
  it("renders Cancelar and the given confirm label", () => {
    render(<ModalFormActions onCancel={() => {}} onConfirm={() => {}} confirmLabel="Agregar" />);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar" })).toBeInTheDocument();
  });

  it("calls onCancel and onConfirm when clicked", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ModalFormActions onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Guardar" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables the confirm button and shows the disabled title when confirmDisabled is set", () => {
    render(
      <ModalFormActions
        onCancel={() => {}}
        onConfirm={() => {}}
        confirmLabel="Guardar"
        confirmDisabled
        confirmDisabledTitle="Completá los campos requeridos"
      />,
    );
    const confirmButton = screen.getByRole("button", { name: "Guardar" });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute("title", "Completá los campos requeridos");
  });

  it("supports a custom cancel label", () => {
    render(<ModalFormActions onCancel={() => {}} onConfirm={() => {}} confirmLabel="Agregar" cancelLabel="Volver" />);
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });
});
