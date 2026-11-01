import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TableTextCell from "@components/TableTextCell/TableTextCell";

function renderInTable(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>,
  );
}

describe("TableTextCell", () => {
  it("renders an accessible but visually hidden label, optional by default", () => {
    renderInTable(<TableTextCell id="repairs" label="Reparaciones necesarias" value="" onChange={() => {}} />);
    const field = screen.getByLabelText(/reparaciones necesarias/i);
    expect(field).not.toBeRequired();
    expect(screen.getByText(/reparaciones necesarias/i)).toHaveClass("sr-only");
  });

  it("calls onChange with the new value as the user types", () => {
    const onChange = vi.fn();
    renderInTable(<TableTextCell id="deadline" label="Plazo" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/plazo/i), { target: { value: "2026-12-01" } });
    expect(onChange).toHaveBeenCalledWith("2026-12-01");
  });
});
