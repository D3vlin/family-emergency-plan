import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "@components/ThemeToggle/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the moon and offers to switch to dark mode when currently light", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /cambiar a modo oscuro/i });
    expect(button).toHaveTextContent("🌙");
  });

  it("switches to dark mode on click, showing the sun and the opposite label", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /cambiar a modo oscuro/i }));

    const button = screen.getByRole("button", { name: /cambiar a modo claro/i });
    expect(button).toHaveTextContent("☀️");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
