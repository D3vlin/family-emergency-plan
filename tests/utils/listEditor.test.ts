import { describe, expect, it } from "vitest";
import { getAddDisabledTitle, newId } from "@utils/listEditor";

describe("newId", () => {
  it("returns a non-empty string", () => {
    expect(newId().length).toBeGreaterThan(0);
  });

  it("returns a different value on each call", () => {
    expect(newId()).not.toBe(newId());
  });
});

describe("getAddDisabledTitle", () => {
  it("returns undefined when neither condition applies", () => {
    expect(getAddDisabledTitle(false, false, "20 contactos")).toBeUndefined();
  });

  it("explains an open editor first, even if also at the limit", () => {
    expect(getAddDisabledTitle(true, true, "20 contactos")).toBe(
      "Guardá o cancelá la edición actual antes de continuar.",
    );
  });

  it("explains the limit, with the given label, once there's no open editor", () => {
    expect(getAddDisabledTitle(false, true, "20 contactos")).toBe("Llegaste al límite de 20 contactos");
  });
});
