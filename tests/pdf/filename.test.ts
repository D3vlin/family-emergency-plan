import { describe, expect, it } from "vitest";
import { buildPdfFilename } from "@pdf/filename";

describe("buildPdfFilename", () => {
  it("uses the plan name from the header", () => {
    expect(buildPdfFilename("Familia Perez")).toBe("plan-familia-perez.pdf");
  });

  it("normalizes spaces, accents and uppercase", () => {
    expect(buildPdfFilename("Familiar Pérez Núñez")).toBe("plan-familiar-perez-nunez.pdf");
  });

  it("doesn't double the 'plan-' prefix when the plan name already starts with 'Plan'", () => {
    expect(buildPdfFilename("Plan Familiar Pérez Núñez")).toBe("plan-familiar-perez-nunez.pdf");
    expect(buildPdfFilename("Plan")).toBe("plan.pdf");
    expect(buildPdfFilename("Planificación familiar")).toBe("plan-planificacion-familiar.pdf");
  });

  it("falls back to a generic name when the plan name is empty", () => {
    expect(buildPdfFilename("")).toBe("plan.pdf");
  });

  it.each([
    ["Familia/Perez", "/"],
    ["Familia\\Perez", "\\"],
    ["../../etc/Familia Perez", ".."],
  ])("strips dangerous character %s from %s", (name, dangerous) => {
    expect(buildPdfFilename(name)).not.toContain(dangerous);
  });

  it("strips control characters, not just path separators", () => {
    const name = "Familia\x00Perez\x1f\x7f";
    const result = buildPdfFilename(name);
    expect(result).toBe("plan-familiaperez.pdf");
    // eslint-disable-next-line no-control-regex
    expect(result).not.toMatch(/[\x00-\x1f\x7f]/);
  });
});
