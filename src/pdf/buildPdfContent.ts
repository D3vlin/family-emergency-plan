import type { Contact } from "@wizard/contact";
import { formatPhoneForDisplay } from "@wizard/formatPhone";
import type { FamilyMember } from "@wizard/familyMember";
import type { Pet } from "@wizard/pet";
import {
  countHousingGood,
  countKitChecked,
  RISK_FIELDS,
  TOTAL_HOUSING_ITEMS,
  TOTAL_KIT_ITEMS,
  unresolvedPetKitItems,
} from "@wizard/reviewSummary";
import type { HeaderStepData, PlanData } from "@wizard/stepValidators";
import type { ClosingData } from "@wizard/closing";
import type { RisksData } from "@pages/Step6Risks/Step6Risks";
import { COMPLEMENTARY_ITEMS, SURVIVAL_SUPPLIES } from "@pages/Step7EmergencyKit/emergencyKitItems";
import type { EmergencyKitData } from "@pages/Step7EmergencyKit/Step7EmergencyKit";
import { HOUSING_CHECK_ITEMS } from "@pages/Step8HousingCheck/housingCheckItems";
import type { HousingCheckData } from "@pages/Step8HousingCheck/Step8HousingCheck";
import { PET_KIT_ITEMS } from "@pages/Step9Pets/petKitItems";

export type PdfBlock = { type: "lines"; lines: string[] } | { type: "table"; head: string[]; rows: string[][] };

export interface PdfSection {
  title: string;
  blocks: PdfBlock[];
}

function lines(values: string[]): PdfBlock {
  return { type: "lines", lines: values };
}

function table(head: string[], rows: string[][]): PdfBlock {
  return { type: "table", head, rows };
}

function mark(checked: boolean): string {
  return checked ? "X" : "";
}

function medicationLabel(medication: FamilyMember["medications"][number], illnesses: FamilyMember["illnesses"]): string {
  const base = `${medication.name} (${medication.dose})`;
  const linkedNames = medication.illnessIds
    .map((id) => illnesses.find((i) => i.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return linkedNames.length > 0 ? `${base} — para ${linkedNames.join(", ")}` : base;
}

export function buildPdfSections(planData: PlanData): PdfSection[] {
  const header = (planData.header as HeaderStepData | undefined) ?? {};
  const members = (planData.familyMembers as FamilyMember[] | undefined) ?? [];
  const contacts = (planData.contacts as Contact[] | undefined) ?? [];
  const disabilitiesNotApplicable = Boolean(planData.disabilitiesNotApplicable);
  const risks = (planData.risks as RisksData | undefined) ?? {};
  const emergencyKit = (planData.emergencyKit as EmergencyKitData | undefined) ?? {};
  const housingCheck = (planData.housingCheck as HousingCheckData | undefined) ?? {};
  const petsNotApplicable = Boolean(planData.petsNotApplicable);
  const pets = (planData.pets as Pet[] | undefined) ?? [];
  const closing = (planData.closing as ClosingData | undefined) ?? {};

  const membersWithDisabilities = members.filter((m) => m.disabilities.length > 0).length;
  const housingGoodCount = countHousingGood(housingCheck);
  const petsWithUnresolvedKit = pets.flatMap((pet) => unresolvedPetKitItems(pet));

  const sections: PdfSection[] = [];

  sections.push({
    title: "Resumen",
    blocks: [
      lines([
        `${members.length} integrante${members.length === 1 ? "" : "s"}, ${pets.length} mascota${
          pets.length === 1 ? "" : "s"
        }, ${membersWithDisabilities} persona${membersWithDisabilities === 1 ? "" : "s"} con discapacidad.`,
      ]),
    ],
  });

  sections.push({
    title: "Encabezado",
    blocks: [
      lines([
        `Nombre del plan: ${header.planName || "(sin completar)"}`,
        `Dirección: ${header.address || "(sin completar)"}`,
      ]),
    ],
  });

  sections.push({
    title: "Grupo familiar",
    blocks: [
      table(
        ["Nombre", "Identificación", "Parentesco", "Edad", "Enfermedades", "Medicamentos", "Teléfono"],
        members.map((m) => [
          m.name,
          `${m.documentType} ${m.documentNumber}`.trim(),
          m.relationship,
          m.age,
          m.illnesses.map((i) => i.name).join(", "),
          m.medications.map((med) => medicationLabel(med, m.illnesses)).join(", "),
          m.phones.map(formatPhoneForDisplay).join(", "),
        ]),
      ),
    ],
  });

  if (contacts.length > 0) {
    sections.push({
      title: "Teléfonos importantes",
      blocks: [table(["Nombre", "Teléfono"], contacts.map((c) => [c.name, formatPhoneForDisplay(c.phone)]))],
    });
  }

  sections.push({
    title: "Personas con discapacidad",
    blocks: disabilitiesNotApplicable
      ? [lines(["No aplica"])]
      : [
          table(
            ["Nombre", "Tipo de discapacidad", "Requiere soporte vital o cuidados especiales"],
            members
              .filter((m) => m.disabilities.length > 0)
              .map((m) => [m.name, m.disabilities.map((d) => d.type).join(", "), m.requiresLifeSupport]),
          ),
        ],
  });

  const siteRows = members.flatMap((m) =>
    m.frequentSites.map((s) => [m.name, s.site, `${s.contactPerson} ${formatPhoneForDisplay(s.contactPhone)}`.trim()]),
  );
  sections.push({
    title: "Sitios y personas frecuentes",
    blocks:
      siteRows.length > 0
        ? [table(["Nombre", "Sitio", "Persona y teléfono de contacto"], siteRows)]
        : [lines(["Sin sitios registrados"])],
  });

  sections.push({
    title: "Riesgos y puntos de encuentro",
    blocks: [lines(RISK_FIELDS.map(({ key, label }) => `${label}: ${risks[key] || "(sin completar)"}`))],
  });

  sections.push({
    title: "Maletín de emergencias",
    blocks: [
      lines(["Suministros de supervivencia"]),
      table(
        ["Elemento", "SI", "NO"],
        SURVIVAL_SUPPLIES.map((item) => {
          const checked = Boolean(emergencyKit.survivalSupplies?.[item]);
          return [item, mark(checked), mark(!checked)];
        }),
      ),
      lines(["Documentos y elementos complementarios"]),
      table(
        ["Elemento", "SI", "NO"],
        COMPLEMENTARY_ITEMS.map((item) => {
          const checked = Boolean(emergencyKit.complementaryItems?.[item]);
          return [item, mark(checked), mark(!checked)];
        }),
      ),
      lines([`Completados ${countKitChecked(emergencyKit)} de ${TOTAL_KIT_ITEMS}`]),
    ],
  });

  sections.push({
    title: "Verificación de la vivienda",
    blocks: [
      table(
        ["Ítem", "Bueno", "Malo", "Reparaciones necesarias", "Plazo", "Responsable"],
        HOUSING_CHECK_ITEMS.map((item) => {
          const entry = housingCheck[item] ?? {};
          return [
            item,
            mark(entry.status === "bueno"),
            mark(entry.status === "malo"),
            entry.repairsNeeded ?? "",
            entry.deadline ?? "",
            entry.responsible ?? "",
          ];
        }),
      ),
      lines([`${housingGoodCount} ítem${housingGoodCount === 1 ? "" : "s"} en buen estado de ${TOTAL_HOUSING_ITEMS}`]),
    ],
  });

  const petBlocks: PdfBlock[] = [];
  if (!petsNotApplicable) {
    if (petsWithUnresolvedKit.length > 0) {
      petBlocks.push(
        lines([
          `Tenés ${petsWithUnresolvedKit.length} ítem${petsWithUnresolvedKit.length === 1 ? "" : "s"} del kit sin fecha de vencimiento registrada.`,
        ]),
      );
    }
    if (pets.length > 0) {
      petBlocks.push(
        table(
          ["Nombre", "Especie", "Comportamiento", "Medicamentos", "Alimentación especial", "Enfermedades", "Discapacidad"],
          pets.map((pet) => [
            pet.name,
            pet.species,
            [pet.stressBehavior, pet.strangerBehavior].filter(Boolean).join(" / "),
            pet.medications,
            pet.specialDiet,
            pet.illnesses,
            pet.disabilities,
          ]),
        ),
      );
      for (const pet of pets) {
        petBlocks.push(
          lines([
            `${pet.name} — Veterinario: ${pet.vetName || "(sin completar)"} ${formatPhoneForDisplay(pet.vetPhone)}`.trim(),
            `${pet.name} — Familiar a cargo: ${pet.caretakerName || "(sin completar)"} ${formatPhoneForDisplay(pet.caretakerPhone)}`.trim(),
          ]),
        );
        petBlocks.push(
          table(
            [`Kit de ${pet.name}`, "SI", "NO", "Fecha de vencimiento/observaciones"],
            PET_KIT_ITEMS.map((item) => {
              const entry = pet.kit[item];
              const checked = Boolean(entry?.checked);
              return [item, mark(checked), mark(!checked), entry?.expiryOrNotes ?? ""];
            }),
          ),
        );
      }
    }
  } else {
    petBlocks.push(lines(["No aplica"]));
  }
  sections.push({ title: "Mascotas", blocks: petBlocks });

  sections.push({
    title: "Cierre",
    blocks: [
      lines([
        `Última revisión: ${closing.lastReviewDate || "(sin completar)"}`,
        `Próxima revisión: ${closing.nextReviewDate || "(sin completar)"}`,
      ]),
    ],
  });

  return sections;
}
