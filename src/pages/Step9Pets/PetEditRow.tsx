import { useState } from "react";
import Modal from "@components/Modal/Modal";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import RemoveButton from "@components/RemoveButton/RemoveButton";
import SelectField from "@components/SelectField/SelectField";
import TableTextCell from "@components/TableTextCell/TableTextCell";
import TextField from "@components/TextField/TextField";
import { MAX_SHORT_FIELD_LENGTH } from "@constants/fieldLimits";
import { sanitizePhoneInput } from "@wizard/formatPhone";
import { isPhoneFormatValid, type Pet } from "@wizard/pet";
import { PET_KIT_ITEMS } from "./petKitItems";

interface PetEditRowProps {
  pet: Pet;
  onSave: (pet: Pet) => void;
  onCancel: () => void;
}

export default function PetEditRow({ pet, onSave, onCancel }: PetEditRowProps) {
  const [draft, setDraft] = useState<Pet>(pet);
  const [errors, setErrors] = useState<{ name?: string; species?: string; vetPhone?: string; caretakerPhone?: string }>(
    {},
  );
  const [addingKitItem, setAddingKitItem] = useState(false);
  const [kitItemType, setKitItemType] = useState("");
  const [kitItemNotes, setKitItemNotes] = useState("");

  const requiredFieldsFilled = Boolean(draft.name.trim() && draft.species.trim());

  function handleSave() {
    const nextErrors: typeof errors = {};
    if (!draft.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!draft.species.trim()) nextErrors.species = "La especie es obligatoria.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (draft.vetPhone.trim() && !isPhoneFormatValid(draft.vetPhone)) {
      setErrors({ vetPhone: "El teléfono del veterinario tiene un formato inválido." });
      return;
    }
    if (draft.caretakerPhone.trim() && !isPhoneFormatValid(draft.caretakerPhone)) {
      setErrors({ caretakerPhone: "El teléfono del familiar a cargo tiene un formato inválido." });
      return;
    }
    setErrors({});
    onSave(draft);
  }

  function clearError(field: keyof typeof errors) {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  }

  function toggleHasEmergencyKit(checked: boolean) {
    setDraft({ ...draft, hasEmergencyKit: checked, kit: checked ? draft.kit : {} });
  }

  function setKitNotes(item: string, value: string) {
    const current = draft.kit[item] ?? { checked: false, expiryOrNotes: "" };
    setDraft({ ...draft, kit: { ...draft.kit, [item]: { ...current, expiryOrNotes: value } } });
  }

  function removeKitItem(item: string) {
    const next = { ...draft.kit };
    delete next[item];
    setDraft({ ...draft, kit: next });
  }

  function openAddKitItem() {
    setKitItemType("");
    setKitItemNotes("");
    setAddingKitItem(true);
  }

  function cancelAddKitItem() {
    setAddingKitItem(false);
  }

  function submitAddKitItem() {
    if (!kitItemType) return;
    setDraft({ ...draft, kit: { ...draft.kit, [kitItemType]: { checked: true, expiryOrNotes: kitItemNotes } } });
    setAddingKitItem(false);
  }

  const addedItems = PET_KIT_ITEMS.filter((item) => draft.kit[item]?.checked);
  const availableItems = PET_KIT_ITEMS.filter((item) => !draft.kit[item]?.checked);
  const petLabel = draft.name.trim() || "esta mascota";

  return (
    <div data-testid="pet-edit-row" className="card space-y-3">
      <div className="grid gap-x-4 md:grid-cols-2">
        <div className="space-y-1">
          <TextField
            id={`pet-name-${pet.id}`}
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
            id={`pet-species-${pet.id}`}
            label="Especie"
            maxLength={MAX_SHORT_FIELD_LENGTH}
            error={errors.species}
            value={draft.species}
            onChange={(value) => {
              setDraft({ ...draft, species: value });
              clearError("species");
            }}
          />
          <TextField
            id={`pet-stress-${pet.id}`}
            label="Comportamiento en situaciones de estrés"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.stressBehavior}
            onChange={(value) => setDraft({ ...draft, stressBehavior: value })}
          />
          <TextField
            id={`pet-strangers-${pet.id}`}
            label="Comportamiento con desconocidos"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.strangerBehavior}
            onChange={(value) => setDraft({ ...draft, strangerBehavior: value })}
          />
          <TextField
            id={`pet-medications-${pet.id}`}
            label="Medicamentos (nombre y dosis)"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.medications}
            onChange={(value) => setDraft({ ...draft, medications: value })}
          />
          <TextField
            id={`pet-diet-${pet.id}`}
            label="Alimentación especial"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.specialDiet}
            onChange={(value) => setDraft({ ...draft, specialDiet: value })}
          />
        </div>

        <div className="space-y-1">
          <TextField
            id={`pet-illnesses-${pet.id}`}
            label="Enfermedades"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.illnesses}
            onChange={(value) => setDraft({ ...draft, illnesses: value })}
          />
          <TextField
            id={`pet-disabilities-${pet.id}`}
            label="Discapacidad"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.disabilities}
            onChange={(value) => setDraft({ ...draft, disabilities: value })}
          />
          <TextField
            id={`pet-vet-name-${pet.id}`}
            label="Nombre del veterinario"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.vetName}
            onChange={(value) => setDraft({ ...draft, vetName: value })}
          />
          <TextField
            id={`pet-vet-phone-${pet.id}`}
            label="Teléfono del veterinario"
            required={false}
            placeholder="ej. 300 123 4567"
            maxLength={MAX_SHORT_FIELD_LENGTH}
            error={errors.vetPhone}
            value={draft.vetPhone}
            onChange={(value) => {
              setDraft({ ...draft, vetPhone: sanitizePhoneInput(value) });
              clearError("vetPhone");
            }}
          />
          <TextField
            id={`pet-caretaker-name-${pet.id}`}
            label="Nombre del familiar a cargo"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.caretakerName}
            onChange={(value) => setDraft({ ...draft, caretakerName: value })}
          />
          <TextField
            id={`pet-caretaker-phone-${pet.id}`}
            label="Teléfono del familiar a cargo"
            required={false}
            placeholder="ej. 300 123 4567"
            maxLength={MAX_SHORT_FIELD_LENGTH}
            error={errors.caretakerPhone}
            value={draft.caretakerPhone}
            onChange={(value) => {
              setDraft({ ...draft, caretakerPhone: sanitizePhoneInput(value) });
              clearError("caretakerPhone");
            }}
          />
        </div>
      </div>

      <fieldset className="field-group">
        <legend className="section-title px-1">Kit de emergencia</legend>
        <label htmlFor={`pet-has-kit-${pet.id}`} className="field-checkbox-row text-sm font-medium">
          <input
            id={`pet-has-kit-${pet.id}`}
            type="checkbox"
            checked={Boolean(draft.hasEmergencyKit)}
            onChange={(e) => toggleHasEmergencyKit(e.target.checked)}
          />
          ¿Tienen kit de emergencia armado para {petLabel}?
        </label>

        {draft.hasEmergencyKit && (
          <div className="mt-3">
            {addedItems.length > 0 ? (
              <div className="table-wrapper">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="table-header-row-muted">
                      <th className="p-2">Elemento</th>
                      <th className="p-2">Fecha de vencimiento/observaciones</th>
                      <th className="p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedItems.map((item, index) => (
                      <tr key={item} className="table-body-row">
                        <td className="table-cell">{item}</td>
                        <TableTextCell
                          id={`pet-kit-notes-${pet.id}-${index}`}
                          label={`Fecha de vencimiento/observaciones de ${item}`}
                          placeholder="Fecha/observaciones"
                          maxLength={MAX_SHORT_FIELD_LENGTH}
                          value={draft.kit[item]?.expiryOrNotes ?? ""}
                          onChange={(value) => setKitNotes(item, value)}
                        />
                        <td className="table-cell">
                          <RemoveButton onClick={() => removeKitItem(item)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">Sin ítems agregados todavía.</p>
            )}

            <button
              type="button"
              className="btn-secondary mt-2"
              disabled={availableItems.length === 0}
              title={availableItems.length === 0 ? "Ya agregaste todos los ítems del kit" : undefined}
              onClick={openAddKitItem}
            >
              Agregar ítem
            </button>

            {addingKitItem && (
              <Modal role="alertdialog" ariaLabel={`Agregar ítem del kit para ${petLabel}`}>
                <SelectField
                  id={`kit-item-type-${pet.id}`}
                  label="Elemento"
                  value={kitItemType}
                  onChange={setKitItemType}
                  options={availableItems}
                  placeholder="Seleccioná un ítem"
                  autoFocus
                />
                <TextField
                  id={`kit-item-notes-${pet.id}`}
                  label="Fecha de vencimiento/observaciones"
                  required={false}
                  placeholder="Fecha/observaciones"
                  maxLength={MAX_SHORT_FIELD_LENGTH}
                  value={kitItemNotes}
                  onChange={setKitItemNotes}
                />
                <ModalFormActions
                  onCancel={cancelAddKitItem}
                  onConfirm={submitAddKitItem}
                  confirmLabel="Agregar"
                  confirmDisabled={!kitItemType}
                  confirmDisabledTitle="Seleccioná un ítem para guardar"
                />
              </Modal>
            )}
          </div>
        )}
      </fieldset>

      <ModalFormActions
        onCancel={onCancel}
        onConfirm={handleSave}
        confirmLabel="Guardar"
        confirmDisabled={!requiredFieldsFilled}
        confirmDisabledTitle="Completá nombre y especie para guardar"
      />
    </div>
  );
}
