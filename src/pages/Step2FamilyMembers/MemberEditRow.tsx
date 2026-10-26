import { useState } from "react";
import AddIconButton from "@components/AddIconButton/AddIconButton";
import ConfirmDialog from "@components/ConfirmDialog/ConfirmDialog";
import Modal from "@components/Modal/Modal";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import RemoveLinkButton from "@components/RemoveLinkButton/RemoveLinkButton";
import SelectField from "@components/SelectField/SelectField";
import TextField from "@components/TextField/TextField";
import { MAX_DOCUMENT_NUMBER_LENGTH, MAX_SHORT_FIELD_LENGTH } from "@constants/fieldLimits";
import { newId } from "@utils/listEditor";
import { formatPhoneForDisplay, sanitizePhoneInput } from "@wizard/formatPhone";
import {
  DOCUMENT_TYPES,
  UNDER_ONE_YEAR,
  isAgeValid,
  isDuplicateIdentity,
  isPhoneFormatValid,
  type FamilyMember,
  type IllnessEntry,
  type MedicationEntry,
} from "@wizard/familyMember";

interface MemberEditRowProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
}

export default function MemberEditRow({ member, allMembers, onSave, onCancel }: MemberEditRowProps) {
  const [draft, setDraft] = useState<FamilyMember>(member);
  const [newPhone, setNewPhone] = useState("");
  const [newIllness, setNewIllness] = useState("");
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedIllnessIds, setNewMedIllnessIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; documentType?: string; documentNumber?: string; age?: string }>(
    {},
  );
  const [pendingIllnessRemoval, setPendingIllnessRemoval] = useState<string | null>(null);
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showAddIllness, setShowAddIllness] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);

  function cancelAddPhone() {
    setNewPhone("");
    setPhoneError(null);
    setShowAddPhone(false);
  }

  function submitAddPhone() {
    if (!newPhone.trim()) return;
    if (!isPhoneFormatValid(newPhone)) {
      setPhoneError("El teléfono tiene un formato inválido.");
      return;
    }
    setDraft({ ...draft, phones: [...draft.phones, newPhone] });
    setNewPhone("");
    setPhoneError(null);
    setShowAddPhone(false);
  }

  function addIllness() {
    if (!newIllness.trim()) return;
    const illness: IllnessEntry = { id: newId(), name: newIllness };
    setDraft({ ...draft, illnesses: [...draft.illnesses, illness] });
    setNewIllness("");
  }

  function cancelAddIllness() {
    setNewIllness("");
    setShowAddIllness(false);
  }

  function submitAddIllness() {
    addIllness();
    setShowAddIllness(false);
  }

  function removeIllness(illnessId: string) {
    const linkedMeds = draft.medications.filter((m) => m.illnessIds.includes(illnessId));
    if (linkedMeds.length > 0) {
      setPendingIllnessRemoval(illnessId);
      return;
    }
    setDraft({ ...draft, illnesses: draft.illnesses.filter((i) => i.id !== illnessId) });
  }

  function confirmIllnessRemoval() {
    const illnessId = pendingIllnessRemoval!;
    setDraft({
      ...draft,
      illnesses: draft.illnesses.filter((i) => i.id !== illnessId),
      medications: draft.medications.map((m) => ({ ...m, illnessIds: m.illnessIds.filter((id) => id !== illnessId) })),
    });
    setPendingIllnessRemoval(null);
  }

  function addMedication() {
    if (!newMedName.trim()) return;
    const medication: MedicationEntry = { id: newId(), name: newMedName, dose: newMedDose, illnessIds: newMedIllnessIds };
    setDraft({ ...draft, medications: [...draft.medications, medication] });
    setNewMedName("");
    setNewMedDose("");
    setNewMedIllnessIds([]);
  }

  function removeMedication(medicationId: string) {
    setDraft({ ...draft, medications: draft.medications.filter((m) => m.id !== medicationId) });
  }

  function cancelAddMedication() {
    setNewMedName("");
    setNewMedDose("");
    setNewMedIllnessIds([]);
    setShowAddMedication(false);
  }

  function submitAddMedication() {
    addMedication();
    setShowAddMedication(false);
  }

  function linkedIllnessNames(illnessIds: string[]): string {
    const names = draft.illnesses.filter((i) => illnessIds.includes(i.id)).map((i) => i.name);
    return names.length > 0 ? names.join(", ") : "—";
  }

  const requiredFieldsFilled = Boolean(
    draft.name.trim() && draft.documentType.trim() && draft.documentNumber.trim() && draft.age.trim(),
  );

  function handleSave() {
    const nextErrors: typeof errors = {};
    if (!draft.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!draft.documentType.trim()) nextErrors.documentType = "Seleccioná un tipo de documento.";
    if (!draft.documentNumber.trim()) nextErrors.documentNumber = "La identificación es obligatoria.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isAgeValid(draft.age)) {
      setErrors({ age: "La edad es obligatoria: ingresá un número entre 1 y 120, o marcá 'Menor de 1 año'." });
      return;
    }
    if (isDuplicateIdentity(allMembers, draft)) {
      setErrors({ documentNumber: "Ya existe otro integrante con el mismo tipo y número de identificación." });
      return;
    }
    setErrors({});
    onSave(draft);
  }

  function clearError(field: keyof typeof errors) {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  }

  return (
    <div data-testid="member-edit-row" className="card space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <TextField
            id={`name-${member.id}`}
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
        </div>

        <div>
          <SelectField
            id={`doc-type-${member.id}`}
            label="Tipo de documento"
            options={DOCUMENT_TYPES}
            placeholder="Seleccioná un tipo"
            error={errors.documentType}
            value={draft.documentType}
            onChange={(value) => {
              setDraft({ ...draft, documentType: value });
              clearError("documentType");
            }}
          />
        </div>

        <div>
          <TextField
            id={`doc-number-${member.id}`}
            label="Identificación"
            inputMode="numeric"
            maxLength={MAX_DOCUMENT_NUMBER_LENGTH}
            error={errors.documentNumber}
            value={draft.documentNumber}
            onChange={(value) => {
              setDraft({ ...draft, documentNumber: value.replace(/\D/g, "") });
              clearError("documentNumber");
            }}
          />
        </div>

        <div>
          <TextField
            id={`relationship-${member.id}`}
            label="Parentesco"
            required={false}
            maxLength={MAX_SHORT_FIELD_LENGTH}
            value={draft.relationship}
            onChange={(value) => setDraft({ ...draft, relationship: value })}
          />
        </div>

        <div>
          <TextField
            id={`age-${member.id}`}
            label="Edad"
            inputMode="numeric"
            maxLength={3}
            disabled={draft.age === UNDER_ONE_YEAR}
            placeholder="Número de 1 a 120"
            error={errors.age}
            value={draft.age === UNDER_ONE_YEAR ? "" : draft.age}
            onChange={(value) => {
              setDraft({ ...draft, age: value.replace(/\D/g, "") });
              clearError("age");
            }}
          />
          <label htmlFor={`age-under-one-${member.id}`} className="field-checkbox-row text-sm">
            <input
              id={`age-under-one-${member.id}`}
              type="checkbox"
              checked={draft.age === UNDER_ONE_YEAR}
              onChange={(e) => {
                setDraft({ ...draft, age: e.target.checked ? UNDER_ONE_YEAR : "" });
                clearError("age");
              }}
            />
            {UNDER_ONE_YEAR}
          </label>
        </div>
      </div>

      <fieldset className="field-group">
        <legend className="section-title px-1">Teléfonos</legend>
        {draft.phones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[240px] border-collapse text-sm">
              <thead>
                <tr className="table-header-row-muted">
                  <th className="p-2">Número</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {draft.phones.map((phone, index) => (
                  <tr key={`${phone}-${index}`} className="table-body-row">
                    <td className="p-2">{formatPhoneForDisplay(phone)}</td>
                    <td className="p-2">
                      <RemoveLinkButton onClick={() => setDraft({ ...draft, phones: draft.phones.filter((_, i) => i !== index) })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Sin teléfonos agregados todavía.</p>
        )}
        <AddIconButton label="Agregar teléfono" onClick={() => setShowAddPhone(true)} />

        {showAddPhone && (
          <Modal role="alertdialog" ariaLabel="Agregar teléfono">
            {phoneError && <p role="alert" className="alert-error">{phoneError}</p>}
            <TextField
              id={`new-phone-${member.id}`}
              label="Nuevo teléfono"
              required={false}
              maxLength={MAX_SHORT_FIELD_LENGTH}
              placeholder="ej. 300 123 4567"
              autoFocus
              value={newPhone}
              onChange={(value) => setNewPhone(sanitizePhoneInput(value))}
            />
            <ModalFormActions onCancel={cancelAddPhone} onConfirm={submitAddPhone} confirmLabel="Agregar" />
          </Modal>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend className="section-title px-1">Enfermedades</legend>
        {pendingIllnessRemoval && (
          <ConfirmDialog
            ariaLabel="Confirmar eliminación de enfermedad"
            onCancel={() => setPendingIllnessRemoval(null)}
            onConfirm={confirmIllnessRemoval}
          >
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Esta enfermedad está vinculada a uno o más medicamentos. Quedarán desvinculados, pero no se borrarán.
            </p>
          </ConfirmDialog>
        )}
        {draft.illnesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[240px] border-collapse text-sm">
              <thead>
                <tr className="table-header-row-muted">
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {draft.illnesses.map((illness) => (
                  <tr key={illness.id} className="table-body-row">
                    <td className="p-2">{illness.name}</td>
                    <td className="p-2">
                      <RemoveLinkButton onClick={() => removeIllness(illness.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Sin enfermedades agregadas todavía.</p>
        )}
        <AddIconButton label="Agregar enfermedad" onClick={() => setShowAddIllness(true)} />

        {showAddIllness && (
          <Modal role="alertdialog" ariaLabel="Agregar enfermedad">
            <TextField
              id={`new-illness-${member.id}`}
              label="Nueva enfermedad"
              required={false}
              maxLength={MAX_SHORT_FIELD_LENGTH}
              autoFocus
              value={newIllness}
              onChange={setNewIllness}
            />
            <ModalFormActions onCancel={cancelAddIllness} onConfirm={submitAddIllness} confirmLabel="Agregar" />
          </Modal>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend className="section-title px-1">Medicamentos</legend>
        {draft.medications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="table-header-row-muted">
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Dosis</th>
                  <th className="p-2">Enfermedades vinculadas</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {draft.medications.map((medication) => (
                  <tr key={medication.id} className="table-body-row">
                    <td className="p-2">{medication.name}</td>
                    <td className="p-2">{medication.dose || "—"}</td>
                    <td className="p-2">{linkedIllnessNames(medication.illnessIds)}</td>
                    <td className="p-2">
                      <RemoveLinkButton onClick={() => removeMedication(medication.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Sin medicamentos agregados todavía.</p>
        )}
        <AddIconButton label="Agregar medicamento" onClick={() => setShowAddMedication(true)} />

        {showAddMedication && (
          <Modal role="alertdialog" ariaLabel="Agregar medicamento">
            <TextField
              id={`new-med-name-${member.id}`}
              label="Nombre del medicamento"
              required={false}
              maxLength={MAX_SHORT_FIELD_LENGTH}
              autoFocus
              value={newMedName}
              onChange={setNewMedName}
            />
            <TextField
              id={`new-med-dose-${member.id}`}
              label="Dosis"
              required={false}
              maxLength={MAX_SHORT_FIELD_LENGTH}
              value={newMedDose}
              onChange={setNewMedDose}
            />
            {draft.illnesses.length > 0 && (
              <fieldset className="mt-3 rounded-md border border-slate-100 p-2 dark:border-slate-800">
                <legend className="px-1 text-xs font-medium text-slate-600 dark:text-slate-400">Vincular a enfermedades (opcional)</legend>
                {draft.illnesses.map((illness) => (
                  <label key={illness.id} className="field-checkbox-row text-sm">
                    <input
                      type="checkbox"
                      checked={newMedIllnessIds.includes(illness.id)}
                      onChange={(e) =>
                        setNewMedIllnessIds(
                          e.target.checked
                            ? [...newMedIllnessIds, illness.id]
                            : newMedIllnessIds.filter((id) => id !== illness.id),
                        )
                      }
                    />
                    {illness.name}
                  </label>
                ))}
              </fieldset>
            )}
            <ModalFormActions onCancel={cancelAddMedication} onConfirm={submitAddMedication} confirmLabel="Agregar" />
          </Modal>
        )}
      </fieldset>

      <ModalFormActions
        onCancel={onCancel}
        onConfirm={handleSave}
        confirmLabel="Guardar"
        confirmDisabled={!requiredFieldsFilled}
        confirmDisabledTitle="Completá nombre, tipo de documento, identificación y edad para guardar"
      />
    </div>
  );
}
