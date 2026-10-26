import { useState } from "react";
import ConfirmDialog from "@components/ConfirmDialog/ConfirmDialog";
import Modal from "@components/Modal/Modal";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import SelectField from "@components/SelectField/SelectField";
import TextField from "@components/TextField/TextField";
import { MAX_SHORT_FIELD_LENGTH } from "@constants/fieldLimits";
import { STEP_TITLES } from "@constants/stepTitles";
import { getAddDisabledTitle, newId } from "@utils/listEditor";
import { useWizard } from "@wizard/WizardContext";
import {
  DISABILITY_TYPES,
  LIFE_SUPPORT_OPTIONS,
  MAX_DISABILITIES_PER_MEMBER,
  NO_LIFE_SUPPORT,
  type FamilyMember,
} from "@wizard/familyMember";

const OTHER_LIFE_SUPPORT = "Otro";
const LIFE_SUPPORT_SELECT_OPTIONS = [NO_LIFE_SUPPORT, ...LIFE_SUPPORT_OPTIONS, OTHER_LIFE_SUPPORT];
const KNOWN_LIFE_SUPPORT_VALUES = new Set([NO_LIFE_SUPPORT, ...LIFE_SUPPORT_OPTIONS]);

export default function Step4Disabilities() {
  const { planData, updateField } = useWizard();
  const members = (planData.familyMembers as FamilyMember[] | undefined) ?? [];
  const notApplicable = Boolean(planData.disabilitiesNotApplicable);
  const hasAnyData = members.some((m) => m.disabilities.length > 0);
  const [pendingNotApplicable, setPendingNotApplicable] = useState(false);
  const [selectedType, setSelectedType] = useState<Record<string, string>>({});
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [otherLifeSupport, setOtherLifeSupport] = useState<Record<string, boolean>>({});

  function updateMember(memberId: string, patch: Partial<FamilyMember>) {
    updateField(
      "familyMembers",
      members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
    );
  }

  function openAdd(memberId: string) {
    setSelectedType({ ...selectedType, [memberId]: "" });
    setAddingMemberId(memberId);
  }

  function submitAdd(member: FamilyMember) {
    const type = selectedType[member.id];
    if (!type) return;
    updateMember(member.id, { disabilities: [...member.disabilities, { id: newId(), type }] });
    setAddingMemberId(null);
  }

  function removeDisability(member: FamilyMember, disabilityId: string) {
    updateMember(member.id, { disabilities: member.disabilities.filter((d) => d.id !== disabilityId) });
  }

  function requestNotApplicable() {
    if (hasAnyData) {
      setPendingNotApplicable(true);
    } else {
      updateField("disabilitiesNotApplicable", true);
    }
  }

  function confirmNotApplicable() {
    updateField(
      "familyMembers",
      members.map((m) => ({ ...m, disabilities: [], requiresLifeSupport: "" })),
    );
    updateField("disabilitiesNotApplicable", true);
    setPendingNotApplicable(false);
  }

  function setLifeSupport(member: FamilyMember, value: string) {
    if (value === OTHER_LIFE_SUPPORT) {
      setOtherLifeSupport({ ...otherLifeSupport, [member.id]: true });
      updateMember(member.id, { requiresLifeSupport: "" });
    } else {
      setOtherLifeSupport({ ...otherLifeSupport, [member.id]: false });
      updateMember(member.id, { requiresLifeSupport: value });
    }
  }

  const addingMember = members.find((m) => m.id === addingMemberId);
  const isAdding = addingMemberId !== null;
  const availableTypes = addingMember
    ? DISABILITY_TYPES.filter((type) => !addingMember.disabilities.some((d) => d.type === type))
    : [];

  return (
    <main>
      <h1 className="page-title">Paso 4 — {STEP_TITLES[3]}</h1>

      <label htmlFor="disabilities-not-applicable" className="field-checkbox-row text-sm font-medium">
        <input
          id="disabilities-not-applicable"
          type="checkbox"
          checked={notApplicable}
          onChange={(e) => (e.target.checked ? requestNotApplicable() : updateField("disabilitiesNotApplicable", false))}
        />
        No aplica — nadie en mi familia tiene discapacidad
      </label>

      {pendingNotApplicable && (
        <ConfirmDialog ariaLabel="Confirmar que no aplica" onCancel={() => setPendingNotApplicable(false)} onConfirm={confirmNotApplicable}>
          <p className="text-sm">Esto va a borrar las discapacidades ya cargadas. ¿Continuar?</p>
        </ConfirmDialog>
      )}

      {!notApplicable && (
        <div className="mt-4 space-y-4">
          {members.map((member) => {
            const atLimit = member.disabilities.length >= MAX_DISABILITIES_PER_MEMBER;
            const addDisabledTitle = getAddDisabledTitle(isAdding, atLimit, "20 discapacidades para este integrante");
            const isOther =
              otherLifeSupport[member.id] ??
              (member.requiresLifeSupport !== "" && !KNOWN_LIFE_SUPPORT_VALUES.has(member.requiresLifeSupport));

            return (
              <fieldset key={member.id} className="card">
                <legend className="section-title px-1">{member.name || "(sin nombre)"}</legend>

                {member.disabilities.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="w-full min-w-[240px] border-collapse text-sm">
                      <thead>
                        <tr className="table-header-row-muted">
                          <th className="p-2">Tipo</th>
                          <th className="p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.disabilities.map((disability) => (
                          <tr key={disability.id} className="table-body-row">
                            <td className="table-cell">{disability.type}</td>
                            <td className="p-2">
                              <button type="button" className="btn-danger" onClick={() => removeDisability(member, disability.id)}>
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty-state">Sin discapacidades agregadas todavía.</p>
                )}

                <button
                  type="button"
                  className="btn-secondary mt-2"
                  disabled={isAdding || atLimit}
                  title={addDisabledTitle}
                  onClick={() => openAdd(member.id)}
                >
                  Agregar discapacidad
                </button>

                {member.disabilities.length > 0 && (
                  <div className="field-group">
                    <SelectField
                      id={`life-support-${member.id}`}
                      label="¿Requiere soporte vital o cuidados especiales?"
                      value={isOther ? OTHER_LIFE_SUPPORT : member.requiresLifeSupport}
                      onChange={(value) => setLifeSupport(member, value)}
                      options={LIFE_SUPPORT_SELECT_OPTIONS}
                      placeholder="Seleccioná una opción"
                    />
                    {isOther && (
                      <TextField
                        id={`life-support-other-${member.id}`}
                        label="Especificá"
                        value={member.requiresLifeSupport}
                        onChange={(value) => updateMember(member.id, { requiresLifeSupport: value })}
                        required={false}
                        maxLength={MAX_SHORT_FIELD_LENGTH}
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </fieldset>
            );
          })}

          {addingMember && (
            <Modal role="alertdialog" ariaLabel={`Agregar discapacidad para ${addingMember.name}`}>
              <SelectField
                id={`disability-type-${addingMember.id}`}
                label="Tipo de discapacidad"
                value={selectedType[addingMember.id] ?? ""}
                onChange={(value) => setSelectedType({ ...selectedType, [addingMember.id]: value })}
                options={availableTypes}
                placeholder="Seleccioná un tipo"
                autoFocus
              />
              <ModalFormActions
                onCancel={() => setAddingMemberId(null)}
                onConfirm={() => submitAdd(addingMember)}
                confirmLabel="Agregar"
                confirmDisabled={!(selectedType[addingMember.id] ?? "")}
                confirmDisabledTitle="Seleccioná un tipo de discapacidad para guardar"
              />
            </Modal>
          )}
        </div>
      )}
    </main>
  );
}
