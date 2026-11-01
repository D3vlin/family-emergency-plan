import { useState } from "react";
import Modal from "@components/Modal/Modal";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import RemoveButton from "@components/RemoveButton/RemoveButton";
import TextField from "@components/TextField/TextField";
import { MAX_SHORT_FIELD_LENGTH } from "@constants/fieldLimits";
import { STEP_TITLES } from "@constants/stepTitles";
import { getAddDisabledTitle, newId } from "@utils/listEditor";
import { formatPhoneForDisplay, sanitizePhoneInput } from "@wizard/formatPhone";
import { useWizard } from "@wizard/WizardContext";
import { isDuplicateSite, isPhoneFormatValid, MAX_SITES_PER_MEMBER, type FamilyMember, type FrequentSiteEntry } from "@wizard/familyMember";

const EMPTY_DRAFT = { site: "", contactPerson: "", contactPhone: "" };

export default function Step5FrequentSites() {
  const { planData, updateField } = useWizard();
  const members = (planData.familyMembers as FamilyMember[] | undefined) ?? [];
  const [drafts, setDrafts] = useState<Record<string, typeof EMPTY_DRAFT>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, { site?: string; contactPhone?: string }>>({});
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  function updateMember(memberId: string, patch: Partial<FamilyMember>) {
    updateField(
      "familyMembers",
      members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
    );
  }

  function getDraft(memberId: string) {
    return drafts[memberId] ?? EMPTY_DRAFT;
  }

  function getErrors(memberId: string) {
    return fieldErrors[memberId] ?? {};
  }

  function clearFieldError(memberId: string, field: "site" | "contactPhone") {
    if (fieldErrors[memberId]?.[field]) {
      setFieldErrors({ ...fieldErrors, [memberId]: { ...fieldErrors[memberId], [field]: undefined } });
    }
  }

  function openAdd(memberId: string) {
    setFieldErrors({ ...fieldErrors, [memberId]: {} });
    setAddingMemberId(memberId);
  }

  function cancelAdd() {
    if (addingMemberId) {
      setDrafts({ ...drafts, [addingMemberId]: EMPTY_DRAFT });
      setFieldErrors({ ...fieldErrors, [addingMemberId]: {} });
    }
    setAddingMemberId(null);
  }

  function submitAdd(member: FamilyMember) {
    const draft = getDraft(member.id);
    if (!draft.site.trim()) {
      setFieldErrors({ ...fieldErrors, [member.id]: { site: "El sitio es obligatorio." } });
      return;
    }
    if (draft.contactPhone.trim() && !isPhoneFormatValid(draft.contactPhone)) {
      setFieldErrors({ ...fieldErrors, [member.id]: { contactPhone: "El teléfono tiene un formato inválido." } });
      return;
    }

    const entry: FrequentSiteEntry = { id: newId(), ...draft };
    if (isDuplicateSite(member, entry)) {
      setFieldErrors({ ...fieldErrors, [member.id]: { site: `"${draft.site}" ya está registrado para ${member.name}.` } });
      return;
    }
    setFieldErrors({ ...fieldErrors, [member.id]: {} });

    updateMember(member.id, { frequentSites: [...member.frequentSites, entry] });
    setDrafts({ ...drafts, [member.id]: EMPTY_DRAFT });
    setAddingMemberId(null);
  }

  function removeSite(member: FamilyMember, siteId: string) {
    updateMember(member.id, { frequentSites: member.frequentSites.filter((s) => s.id !== siteId) });
  }

  const addingMember = members.find((m) => m.id === addingMemberId);
  const isAdding = addingMemberId !== null;

  return (
    <main>
      <h1 className="page-title">Paso 5 — {STEP_TITLES[4]}</h1>

      <div className="space-y-4">
        {members.map((member) => {
          const atLimit = member.frequentSites.length >= MAX_SITES_PER_MEMBER;
          const addDisabledTitle = getAddDisabledTitle(isAdding, atLimit, "20 sitios para este integrante");

          return (
            <fieldset key={member.id} className="card">
              <legend className="section-title px-1">{member.name || "(sin nombre)"}</legend>

              {member.frequentSites.length > 0 ? (
                <div className="table-wrapper">
                  <table className="w-full min-w-[320px] border-collapse text-sm">
                    <thead>
                      <tr className="table-header-row-muted">
                        <th className="p-2">Sitio</th>
                        <th className="p-2">Contacto</th>
                        <th className="p-2">Teléfono</th>
                        <th className="p-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.frequentSites.map((site) => (
                        <tr key={site.id} className="table-body-row">
                          <td className="table-cell">{site.site}</td>
                          <td className="table-cell-muted">{site.contactPerson || "—"}</td>
                          <td className="table-cell-muted">{formatPhoneForDisplay(site.contactPhone) || "—"}</td>
                          <td className="p-2">
                            <RemoveButton onClick={() => removeSite(member, site.id)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">Sin sitios frecuentes agregados todavía.</p>
              )}

              <button
                type="button"
                className="btn-secondary mt-2"
                disabled={isAdding || atLimit}
                title={addDisabledTitle}
                onClick={() => openAdd(member.id)}
              >
                Agregar sitio
              </button>
            </fieldset>
          );
        })}
      </div>

      {addingMember &&
        (() => {
          const draft = getDraft(addingMember.id);
          const errors = getErrors(addingMember.id);
          return (
            <Modal role="alertdialog" ariaLabel={`Agregar sitio para ${addingMember.name}`}>
              <TextField
                id={`site-${addingMember.id}`}
                label="Sitio"
                maxLength={MAX_SHORT_FIELD_LENGTH}
                autoFocus
                error={errors.site}
                value={draft.site}
                onChange={(value) => {
                  setDrafts({ ...drafts, [addingMember.id]: { ...draft, site: value } });
                  clearFieldError(addingMember.id, "site");
                }}
              />
              <TextField
                id={`site-contact-${addingMember.id}`}
                label="Persona de contacto"
                required={false}
                maxLength={MAX_SHORT_FIELD_LENGTH}
                value={draft.contactPerson}
                onChange={(value) => setDrafts({ ...drafts, [addingMember.id]: { ...draft, contactPerson: value } })}
              />
              <TextField
                id={`site-phone-${addingMember.id}`}
                label="Teléfono"
                required={false}
                placeholder="ej. 300 123 4567"
                maxLength={MAX_SHORT_FIELD_LENGTH}
                error={errors.contactPhone}
                value={draft.contactPhone}
                onChange={(value) => {
                  setDrafts({ ...drafts, [addingMember.id]: { ...draft, contactPhone: sanitizePhoneInput(value) } });
                  clearFieldError(addingMember.id, "contactPhone");
                }}
              />
              <ModalFormActions
                onCancel={cancelAdd}
                onConfirm={() => submitAdd(addingMember)}
                confirmLabel="Agregar"
                confirmDisabled={!draft.site.trim()}
                confirmDisabledTitle="Completá el sitio para guardar"
              />
            </Modal>
          );
        })()}
    </main>
  );
}
