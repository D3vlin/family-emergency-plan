import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Modal from "@components/Modal/Modal";

describe("Modal", () => {
  it("renders its children with the given role and aria-label", () => {
    render(
      <Modal role="alertdialog" ariaLabel="Ejemplo">
        <p>Contenido</p>
      </Modal>,
    );
    const dialog = screen.getByRole("alertdialog", { name: /ejemplo/i });
    expect(dialog).toHaveTextContent("Contenido");
  });

  it("supports role=status without requiring an aria-label", () => {
    render(
      <Modal role="status">
        <p>Aviso</p>
      </Modal>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Aviso");
  });

  it("defaults to the short-content width, and widens with size='lg'", () => {
    const { container, rerender } = render(
      <Modal role="alertdialog" ariaLabel="Ejemplo">
        <p>Contenido</p>
      </Modal>,
    );
    expect(container.querySelector(".modal-content")).not.toHaveClass("modal-content-lg");

    rerender(
      <Modal role="alertdialog" ariaLabel="Ejemplo" size="lg">
        <p>Contenido</p>
      </Modal>,
    );
    expect(container.querySelector(".modal-content")).toHaveClass("modal-content-lg");
  });
});
