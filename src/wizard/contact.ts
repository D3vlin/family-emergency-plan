import { isPhoneFormatValid } from "./familyMember";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export const MAX_CONTACTS = 20;

export function createEmptyContact(id: string): Contact {
  return { id, name: "", phone: "", relationship: "" };
}

function normalizePhone(phone: string): string {
  return phone.trim().toLowerCase().replace(/[\s-]/g, "");
}

export function isDuplicatePhone(contacts: Contact[], candidate: Contact): boolean {
  const target = normalizePhone(candidate.phone);
  return contacts.some((c) => c.id !== candidate.id && normalizePhone(c.phone) === target);
}

export { isPhoneFormatValid };
