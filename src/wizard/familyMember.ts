export interface IllnessEntry {
  id: string;
  name: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  illnessIds: string[];
}

export interface DisabilityEntry {
  id: string;
  type: string;
}

export interface FrequentSiteEntry {
  id: string;
  site: string;
  contactPerson: string;
  contactPhone: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  relationship: string;
  age: string;
  phones: string[];
  illnesses: IllnessEntry[];
  medications: MedicationEntry[];
  disabilities: DisabilityEntry[];
  requiresLifeSupport: string;
  frequentSites: FrequentSiteEntry[];
}

export const MAX_SITES_PER_MEMBER = 20;

export const DISABILITY_TYPES = ["Visual", "Auditiva", "Cognitiva", "Motriz"];
export const NO_LIFE_SUPPORT = "No requiere";
export const LIFE_SUPPORT_OPTIONS = ["Oxígeno", "Vías intravenosas"];
export const MAX_DISABILITIES_PER_MEMBER = 20;

export const DOCUMENT_TYPES = ["Cédula de Ciudadanía", "Tarjeta de Identidad", "Registro Civil"];
export const UNDER_ONE_YEAR = "Menor de 1 año";
export const MAX_FAMILY_MEMBERS = 20;

export function createEmptyMember(id: string): FamilyMember {
  return {
    id,
    name: "",
    documentType: "",
    documentNumber: "",
    relationship: "",
    age: "",
    phones: [],
    illnesses: [],
    medications: [],
    disabilities: [],
    requiresLifeSupport: "",
    frequentSites: [],
  };
}

export function normalizeMember(raw: Partial<FamilyMember> & { id: string }): FamilyMember {
  return { ...createEmptyMember(raw.id), ...raw };
}

function normalizeSite(site: string): string {
  return site.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isDuplicateSite(member: FamilyMember, candidate: FrequentSiteEntry): boolean {
  const target = normalizeSite(candidate.site);
  return member.frequentSites.some((s) => s.id !== candidate.id && normalizeSite(s.site) === target);
}

export function isDisabilitySectionValid(member: FamilyMember): boolean {
  return member.disabilities.length === 0 || member.requiresLifeSupport.trim() !== "";
}

export function isMemberComplete(member: FamilyMember): boolean {
  return Boolean(
    member.name.trim() && member.documentType.trim() && member.documentNumber.trim() && isAgeValid(member.age),
  );
}

export function isPhoneFormatValid(value: string): boolean {
  return /^[0-9+\-\s]+$/.test(value) && /\d/.test(value);
}

export function isAgeValid(age: string): boolean {
  if (!age.trim()) return false;
  if (age === UNDER_ONE_YEAR) return true;
  const n = Number(age);
  return Number.isInteger(n) && n >= 1 && n <= 120;
}

function normalizeIdentity(documentType: string, documentNumber: string): string {
  return `${documentType.trim().toLowerCase()}|${documentNumber.trim().toLowerCase().replace(/[\s-]/g, "")}`;
}

export function isDuplicateIdentity(members: FamilyMember[], candidate: FamilyMember): boolean {
  const target = normalizeIdentity(candidate.documentType, candidate.documentNumber);
  return members.some((m) => m.id !== candidate.id && normalizeIdentity(m.documentType, m.documentNumber) === target);
}
