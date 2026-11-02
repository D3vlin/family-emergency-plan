import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generatePlanPdf } from "@pdf/exportPlan";
import { buildPdfSections } from "@pdf/buildPdfContent";

function pageText(doc: ReturnType<typeof generatePlanPdf>, page: number): string {
  const raw = (doc.internal.pages[page] as unknown as string[]).join(" ");
  const literals = [...raw.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)].map((m) => m[1]);
  return literals.join(" ").replace(/\\([()])/g, "$1");
}

const minimalPlan = {
  header: { planName: "Familia Pérez", address: "Calle 123" },
};

describe("generatePlanPdf", () => {
  it("produces a valid PDF document for a minimal plan", () => {
    const doc = generatePlanPdf(minimalPlan);
    const output = doc.output("datauristring");
    expect(output).toContain("data:application/pdf");
  });

  it("paginates when the content overflows a single page", () => {
    const manyMembers = Array.from({ length: 40 }, (_, i) => ({
      id: `m${i}`,
      name: `Integrante ${i}`,
      documentType: "Cédula de Ciudadanía",
      documentNumber: String(i),
      relationship: "Familiar",
      age: "30",
      phones: [],
      illnesses: [],
      medications: [],
      disabilities: [],
      requiresLifeSupport: "",
      frequentSites: [],
    }));
    const doc = generatePlanPdf({ ...minimalPlan, familyMembers: manyMembers });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it("prints a non-affiliation disclaimer and a data-sensitivity warning on every page", () => {
    const manyMembers = Array.from({ length: 40 }, (_, i) => ({
      id: `m${i}`,
      name: `Integrante ${i}`,
      documentType: "Cédula de Ciudadanía",
      documentNumber: String(i),
      relationship: "Familiar",
      age: "30",
      phones: [],
      illnesses: [],
      medications: [],
      disabilities: [],
      requiresLifeSupport: "",
      frequentSites: [],
    }));

    const doc = generatePlanPdf({ ...minimalPlan, familyMembers: manyMembers });
    const pageCount = doc.getNumberOfPages();
    expect(pageCount).toBeGreaterThan(1);

    for (let page = 1; page <= pageCount; page += 1) {
      const text = pageText(doc, page);
      expect(text).toMatch(/no es una herramienta oficial de la UNGRD/i);
      expect(text).toMatch(/datos sensibles/i);
      expect(text).toMatch(/no expira ni se borra solo/i);
    }
  });

  it("renders the enfermedad-medicamento link in the table cell", () => {
    const member = {
      id: "m1",
      name: "Ana Pérez",
      documentType: "Cédula de Ciudadanía",
      documentNumber: "123",
      relationship: "Madre",
      age: "42",
      phones: [],
      illnesses: [{ id: "i1", name: "Asma" }],
      medications: [{ id: "md1", name: "Salbutamol", dose: "100mcg", illnessIds: ["i1"] }],
      disabilities: [],
      requiresLifeSupport: "",
      frequentSites: [],
    };
    const doc = generatePlanPdf({ ...minimalPlan, familyMembers: [member] });
    const text = pageText(doc, 1);
    expect(text).toContain("Salbutamol (100mcg)");
    expect(text).toContain("para Asma");
  });

  it("never orphans a section title from the first row/line of its own content", () => {
    for (let memberCount = 1; memberCount <= 30; memberCount += 1) {
      const members = Array.from({ length: memberCount }, (_, i) => ({
        id: `m${i}`,
        name: `Integrante Apellido Bastante Largo ${i}`,
        documentType: "Cédula de Ciudadanía",
        documentNumber: String(1000 + i),
        relationship: "Familiar",
        age: "30",
        phones: [],
        illnesses: [{ id: `i${i}`, name: "Hipertensión" }],
        medications: [{ id: `md${i}`, name: "Losartán", dose: "50mg cada 12h", illnessIds: [`i${i}`] }],
        disabilities: [],
        requiresLifeSupport: "",
        frequentSites: [],
      }));
      const planData = {
        ...minimalPlan,
        familyMembers: members,
        risks: { insideRisks: "Estufa a gas" },
        emergencyKit: { survivalSupplies: { Agua: true }, complementaryItems: {} },
      };

      const doc = generatePlanPdf(planData);
      const pageCount = doc.getNumberOfPages();
      const pageTexts = Array.from({ length: pageCount }, (_, i) => pageText(doc, i + 1));

      for (const section of buildPdfSections(planData)) {
        const firstBlock = section.blocks[0];
        if (!firstBlock) continue;
        const firstSnippet = firstBlock.type === "lines" ? firstBlock.lines[0] : (firstBlock.rows[0]?.[0] ?? firstBlock.head[0]);
        if (!firstSnippet) continue;

        const titlePage = pageTexts.findIndex((text) => text.includes(section.title));
        expect(titlePage, `(${memberCount} members) section "${section.title}" title not found on any page`).toBeGreaterThanOrEqual(
          0,
        );
        expect(
          pageTexts[titlePage],
          `(${memberCount} members) "${section.title}" is orphaned from its own first block on its page`,
        ).toContain(firstSnippet);
      }
    }
  });

  describe("page numbering and generation date", () => {
    beforeEach(() => vi.setSystemTime(new Date("2026-10-18T12:00:00Z")));
    afterEach(() => vi.useRealTimers());

    it("prints the ISO generation date on the first page", () => {
      const doc = generatePlanPdf(minimalPlan);
      expect(pageText(doc, 1)).toContain("Generado el 2026-10-18");
    });

    it("prints 'Página X de Y' on every page, with the right total", () => {
      const manyMembers = Array.from({ length: 40 }, (_, i) => ({
        id: `m${i}`,
        name: `Integrante ${i}`,
        documentType: "Cédula de Ciudadanía",
        documentNumber: String(i),
        relationship: "Familiar",
        age: "30",
        phones: [],
        illnesses: [],
        medications: [],
        disabilities: [],
        requiresLifeSupport: "",
        frequentSites: [],
      }));
      const doc = generatePlanPdf({ ...minimalPlan, familyMembers: manyMembers });
      const pageCount = doc.getNumberOfPages();
      expect(pageCount).toBeGreaterThan(1);

      for (let page = 1; page <= pageCount; page += 1) {
        expect(pageText(doc, page)).toContain(`Página ${page} de ${pageCount}`);
      }
    });
  });
});
