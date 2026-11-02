import { describe, expect, it } from "vitest";
import { buildPdfSections, type PdfBlock } from "@pdf/buildPdfContent";

const completeMember = {
  id: "m1",
  name: "Ana Pérez",
  documentType: "Cédula de Ciudadanía",
  documentNumber: "123",
  relationship: "Madre",
  age: "35",
  phones: [],
  illnesses: [],
  medications: [],
  disabilities: [{ id: "d1", type: "Visual" }],
  requiresLifeSupport: "No requiere",
  frequentSites: [],
};

const basePlan = {
  header: { planName: "Familia Pérez", address: "Calle 123" },
  familyMembers: [completeMember],
  contacts: [],
  disabilitiesNotApplicable: false,
  petsNotApplicable: true,
  pets: [],
  risks: { insideRisks: "Estufa a gas" },
  emergencyKit: { survivalSupplies: { Agua: true }, complementaryItems: {} },
  housingCheck: { "Tienen extintores": { status: "bueno" as const } },
  closing: { lastReviewDate: "2026-10-16", nextReviewDate: "2026-11-18" },
};

function flatten(blocks: PdfBlock[]): string {
  return blocks
    .map((block) =>
      block.type === "lines" ? block.lines.join(" ") : [block.head.join(" "), ...block.rows.map((r) => r.join(" "))].join(" "),
    )
    .join(" ");
}

function textOf(sections: ReturnType<typeof buildPdfSections>, title: string): string {
  const section = sections.find((s) => s.title === title);
  return section ? flatten(section.blocks) : "";
}

describe("buildPdfSections", () => {
  it("includes a numeric summary", () => {
    const sections = buildPdfSections(basePlan);
    expect(textOf(sections, "Resumen")).toMatch(/1 integrante.*0 mascotas.*1 persona con discapacidad/);
  });

  it("omits the 'Teléfonos importantes' section entirely when the additional-contacts list is empty", () => {
    const sections = buildPdfSections(basePlan);
    expect(sections.find((s) => s.title === "Teléfonos importantes")).toBeUndefined();
  });

  it("includes 'Teléfonos importantes' as a table when there is at least one additional contact, without a fixed emergency row", () => {
    const sections = buildPdfSections({
      ...basePlan,
      contacts: [{ id: "c1", name: "Luis", phone: "300 123 4567", relationship: "Vecino" }],
    });
    const text = textOf(sections, "Teléfonos importantes");
    expect(text).toContain("Luis");
    expect(text).not.toContain("Emergencias");
  });

  it("renders Grupo familiar as a bordered table (mirrors the official form's table layout)", () => {
    const sections = buildPdfSections(basePlan);
    const section = sections.find((s) => s.title === "Grupo familiar");
    const tableBlock = section?.blocks.find((b) => b.type === "table");
    expect(tableBlock?.type).toBe("table");
    if (tableBlock?.type === "table") {
      expect(tableBlock.head).toEqual(["Nombre", "Identificación", "Parentesco", "Edad", "Enfermedades", "Medicamentos", "Teléfono"]);
      expect(tableBlock.rows[0][0]).toBe("Ana Pérez");
    }
  });

  it("spells out the enfermedad→medicamento link per medication, not two unlinked flat lists", () => {
    const member = {
      ...completeMember,
      illnesses: [
        { id: "i1", name: "Asma" },
        { id: "i2", name: "Hipertensión" },
        { id: "i3", name: "Migraña" },
      ],
      medications: [
        { id: "md1", name: "Salbutamol", dose: "100mcg", illnessIds: ["i1"] },
        { id: "md2", name: "Losartán", dose: "50mg", illnessIds: ["i1", "i2"] },
        { id: "md3", name: "Multivitamínico", dose: "1 al día", illnessIds: [] },
      ],
    };
    const sections = buildPdfSections({ ...basePlan, familyMembers: [member] });
    const tableBlock = sections.find((s) => s.title === "Grupo familiar")?.blocks.find((b) => b.type === "table");
    if (tableBlock?.type !== "table") throw new Error("expected a table block");
    const medicationsCell = tableBlock.rows[0][5];

    expect(medicationsCell).toContain("Salbutamol (100mcg) — para Asma");
    expect(medicationsCell).toContain("Losartán (50mg) — para Asma, Hipertensión");
    expect(medicationsCell).toContain("Multivitamínico (1 al día)");
    expect(medicationsCell).not.toContain("Multivitamínico (1 al día) — para");
    const illnessesCell = tableBlock.rows[0][4];
    expect(illnessesCell).toContain("Migraña");
  });

  it("renders the emergency kit as two SI/NO checklist tables with marks, like the official form", () => {
    const sections = buildPdfSections(basePlan);
    const section = sections.find((s) => s.title === "Maletín de emergencias");
    const tables = section?.blocks.filter((b) => b.type === "table") ?? [];
    expect(tables).toHaveLength(2);
    if (tables[0].type === "table") {
      const aguaRow = tables[0].rows.find((r) => r[0] === "Agua");
      expect(aguaRow?.[1]).toBe("X");
      expect(aguaRow?.[2]).toBe("");
    }
  });

  it("summarizes the housing check as a table with Bueno/Malo mark columns", () => {
    const sections = buildPdfSections(basePlan);
    const section = sections.find((s) => s.title === "Verificación de la vivienda");
    const tableBlock = section?.blocks.find((b) => b.type === "table");
    if (tableBlock?.type === "table") {
      const row = tableBlock.rows.find((r) => r[0] === "Tienen extintores");
      expect(row?.[1]).toBe("X");
      expect(row?.[2]).toBe("");
    }
  });

  it("shows the pet kit as a per-pet table with SI/NO marks and a non-blocking warning line", () => {
    const pet = {
      id: "p1",
      name: "Firulais",
      species: "Perro",
      stressBehavior: "",
      strangerBehavior: "",
      medications: "",
      specialDiet: "",
      illnesses: "",
      disabilities: "",
      vetName: "",
      vetPhone: "",
      caretakerName: "",
      caretakerPhone: "",
      kit: { "Botiquín de primeros auxilios": { checked: true, expiryOrNotes: "" } },
    };
    const sections = buildPdfSections({ ...basePlan, petsNotApplicable: false, pets: [pet] });
    const text = textOf(sections, "Mascotas");
    expect(text).toMatch(/1 ítem.*sin fecha de vencimiento/);
    expect(text).toContain("Botiquín de primeros auxilios");
    expect(text).toContain("Firulais");
  });

  it("summarizes header, risks and closing with their literal fields", () => {
    const sections = buildPdfSections(basePlan);
    expect(textOf(sections, "Encabezado")).toContain("Familia Pérez");
    expect(textOf(sections, "Riesgos y puntos de encuentro")).toContain("Estufa a gas");
    expect(textOf(sections, "Cierre")).toContain("2026-10-16");
  });
});
