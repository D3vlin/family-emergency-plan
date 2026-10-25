import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("App (wizard shell)", () => {
  it("shows the Home splash on a fresh session, instead of jumping straight to Step 1", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Plan Familiar de Emergencias/i })).toBeInTheDocument();
  });

  it("starts the wizard at Step 1 from the Home splash's 'Comenzar' button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /comenzar/i }));
    expect(screen.getByRole("heading", { name: /Paso 1\b/i })).toBeInTheDocument();
  });

  it("renders the base shell without logging console errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /comenzar/i }));
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
