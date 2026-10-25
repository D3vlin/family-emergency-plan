import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CitationFooter from "@components/CitationFooter/CitationFooter";

describe("CitationFooter", () => {
  it("renders the UNGRD citation with a link to the source PDF", () => {
    render(<CitationFooter />);
    const link = screen.getByRole("link", { name: /formato plan familiar/i });
    expect(link).toHaveAttribute(
      "href",
      "https://portal.gestiondelriesgo.gov.co/simulacro/Documents/FORMATO-PLAN-FAMILIAR.pdf",
    );
  });

  it("is fixed to the bottom of the viewport, not just sticky", () => {
    render(<CitationFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.className).toContain("fixed");
    expect(footer.className).toContain("inset-x-0");
    expect(footer.className).toContain("bottom-0");
  });
});
