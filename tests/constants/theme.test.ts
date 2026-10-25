import { describe, expect, it } from "vitest";
import { THEME, Z_INDEX } from "@constants/theme";

describe("THEME", () => {
  it("exposes the agreed color palette", () => {
    expect(THEME.colors.primary).toBe("#16424A");
    expect(THEME.colors.accent).toBe("#F2A71B");
    expect(THEME.colors.success).toBe("#2ECC71");
    expect(THEME.colors.error).toBe("#E74C3C");
    expect(THEME.colors.background).toBe("#F7F9FA");
  });

  it("exposes the agreed font stack", () => {
    expect(THEME.fontFamily).toMatch(/Inter/);
  });

  it("exposes the agreed spacing scale", () => {
    expect(THEME.spacing).toEqual([4, 8, 16, 24, 32]);
  });
});

describe("Z_INDEX", () => {
  it("orders layers from content to modal content", () => {
    expect(Z_INDEX.content).toBeLessThan(Z_INDEX.progressBar);
    expect(Z_INDEX.progressBar).toBeLessThan(Z_INDEX.citationFooter);
    expect(Z_INDEX.citationFooter).toBeLessThan(Z_INDEX.modalBackdrop);
    expect(Z_INDEX.modalBackdrop).toBeLessThan(Z_INDEX.modalContent);
  });
});
