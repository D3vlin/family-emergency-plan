import { useState } from "react";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import TextField from "@components/TextField/TextField";
import { MAX_SHORT_FIELD_LENGTH } from "@constants/fieldLimits";
import { isPhoneFormatValid, type Contact } from "@wizard/contact";
import { sanitizePhoneInput } from "@wizard/formatPhone";

interface ContactEditRowProps {
  contact: Contact;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

export default function ContactEditRow({ contact, onSave, onCancel }: ContactEditRowProps) {
  const [draft, setDraft] = useState<Contact>(contact);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const requiredFieldsFilled = Boolean(draft.name.trim() && draft.phone.trim());

  function handleSave() {
    const nextErrors: typeof errors = {};
    if (!draft.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!draft.phone.trim()) nextErrors.phone = "El teléfono es obligatorio.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isPhoneFormatValid(draft.phone)) {
      setErrors({ phone: "El teléfono tiene un formato inválido." });
      return;
    }
    setErrors({});
    onSave(draft);
  }

  function clearError(field: keyof typeof errors) {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  }

  return (
    <div data-testid="contact-edit-row" className="card space-y-1">
      <TextField
        id={`contact-name-${contact.id}`}
        label="Nombre"
        maxLength={MAX_SHORT_FIELD_LENGTH}
        autoFocus
        error={errors.name}
        value={draft.name}
        onChange={(value) => {
          setDraft({ ...draft, name: value });
          clearError("name");
        }}
      />

      <TextField
        id={`contact-phone-${contact.id}`}
        label="Teléfono"
        placeholder="ej. 300 123 4567"
        maxLength={MAX_SHORT_FIELD_LENGTH}
        error={errors.phone}
        value={draft.phone}
        onChange={(value) => {
          setDraft({ ...draft, phone: sanitizePhoneInput(value) });
          clearError("phone");
        }}
      />

      <TextField
        id={`contact-relationship-${contact.id}`}
        label="Relación"
        required={false}
        maxLength={MAX_SHORT_FIELD_LENGTH}
        value={draft.relationship}
        onChange={(value) => setDraft({ ...draft, relationship: value })}
      />

      <ModalFormActions
        onCancel={onCancel}
        onConfirm={handleSave}
        confirmLabel="Guardar"
        confirmDisabled={!requiredFieldsFilled}
        confirmDisabledTitle="Completá nombre y teléfono para guardar"
      />
    </div>
  );
}
