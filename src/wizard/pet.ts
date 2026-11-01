import { isPhoneFormatValid } from "./familyMember";

export interface PetKitEntry {
  checked: boolean;
  expiryOrNotes: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  stressBehavior: string;
  strangerBehavior: string;
  medications: string;
  specialDiet: string;
  illnesses: string;
  disabilities: string;
  vetName: string;
  vetPhone: string;
  caretakerName: string;
  caretakerPhone: string;
  hasEmergencyKit?: boolean;
  kit: Record<string, PetKitEntry>;
}

export const MAX_PETS = 20;

export function createEmptyPet(id: string): Pet {
  return {
    id,
    name: "",
    species: "",
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
    hasEmergencyKit: false,
    kit: {},
  };
}

export function isPetComplete(pet: Pet): boolean {
  return Boolean(pet.name.trim() && pet.species.trim());
}

export { isPhoneFormatValid };
