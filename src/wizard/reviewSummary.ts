import { COMPLEMENTARY_ITEMS, SURVIVAL_SUPPLIES } from "@pages/Step7EmergencyKit/emergencyKitItems";
import type { EmergencyKitData } from "@pages/Step7EmergencyKit/Step7EmergencyKit";
import { HOUSING_CHECK_ITEMS } from "@pages/Step8HousingCheck/housingCheckItems";
import type { HousingCheckData } from "@pages/Step8HousingCheck/Step8HousingCheck";
import { PET_KIT_ITEMS } from "@pages/Step9Pets/petKitItems";
import type { RisksData } from "@pages/Step6Risks/Step6Risks";
import type { Pet } from "./pet";

export const TOTAL_KIT_ITEMS = SURVIVAL_SUPPLIES.length + COMPLEMENTARY_ITEMS.length;
export const TOTAL_HOUSING_ITEMS = HOUSING_CHECK_ITEMS.length;

export const RISK_FIELDS: Array<{ key: keyof RisksData; label: string }> = [
  { key: "insideRisks", label: "Riesgos al interior de la casa" },
  { key: "evacuationRoute", label: "Ruta de evacuación y peligros en los alrededores" },
  { key: "surroundingHazards", label: "Identificación de peligros alrededor de la vivienda" },
  { key: "mainMeetingPoint", label: "Punto de encuentro principal" },
  { key: "alternateMeetingPoint", label: "Punto de encuentro alterno" },
];

export function countKitChecked(kit: EmergencyKitData): number {
  const survivalSupplies = kit.survivalSupplies ?? {};
  const complementaryItems = kit.complementaryItems ?? {};
  return Object.values(survivalSupplies).filter(Boolean).length + Object.values(complementaryItems).filter(Boolean).length;
}

export function countHousingGood(housingCheck: HousingCheckData): number {
  return HOUSING_CHECK_ITEMS.filter((item) => housingCheck[item]?.status === "bueno").length;
}

export function unresolvedPetKitItems(pet: Pet): string[] {
  return PET_KIT_ITEMS.filter((item) => pet.kit[item]?.checked && !pet.kit[item]?.expiryOrNotes.trim());
}
