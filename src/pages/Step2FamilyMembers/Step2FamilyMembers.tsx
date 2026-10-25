import { useState } from "react";
import Modal from "@components/Modal/Modal";
import { STEP_TITLES } from "@constants/stepTitles";
import { useWizard } from "@wizard/WizardContext";
import { createEmptyMember, MAX_FAMILY_MEMBERS, type FamilyMember } from "@wizard/familyMember";
import DeleteMemberConfirm from "./DeleteMemberConfirm";
import MemberEditRow from "./MemberEditRow";

function newId(): string {
  return Math.random().toString(36).slice(2);
}

export default function Step2FamilyMembers() {
  const { planData, updateField } = useWizard();
  const members = (planData.familyMembers as FamilyMember[] | undefined) ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<FamilyMember | null>(null);

  function setMembers(next: FamilyMember[]) {
    updateField("familyMembers", next);
  }

  function addMember() {
    setNewDraft(createEmptyMember(newId()));
  }

  function saveNewMember(saved: FamilyMember) {
    setMembers([...members, saved]);
    setNewDraft(null);
  }

  function saveMember(saved: FamilyMember) {
    setMembers(members.map((m) => (m.id === saved.id ? saved : m)));
    setEditingId(null);
  }

  function confirmDelete() {
    setMembers(members.filter((m) => m.id !== pendingDeleteId));
    setPendingDeleteId(null);
  }

  const memberPendingDelete = members.find((m) => m.id === pendingDeleteId);
  const editingMember = members.find((m) => m.id === editingId);
  const isEditorOpen = newDraft !== null || editingId !== null;
  const addDisabledTitle = isEditorOpen
    ? "Guardá o cancelá la edición actual antes de continuar."
    : members.length >= MAX_FAMILY_MEMBERS
      ? "Llegaste al límite de 20 integrantes"
      : undefined;

  return (
    <main>
      <h1 className="page-title">Paso 2 — {STEP_TITLES[1]}</h1>

      {members.length === 0 ? (
        <p className="empty-state">Sin integrantes agregados todavía.</p>
      ) : (
        <div className="table-wrapper">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="table-header-row">
                <th className="p-3">Nombre</th>
                <th className="p-3">Documento</th>
                <th className="p-3">Parentesco</th>
                <th className="p-3">Edad</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="table-body-row">
                  <td className="p-3 align-top text-slate-800 dark:text-slate-200">{member.name}</td>
                  <td className="p-3 align-top text-slate-700 dark:text-slate-300">
                    {member.documentType} {member.documentNumber}
                  </td>
                  <td className="p-3 align-top text-slate-700 dark:text-slate-300">{member.relationship || "—"}</td>
                  <td className="p-3 align-top text-slate-700 dark:text-slate-300">{member.age || "—"}</td>
                  <td className="p-3 align-top">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditingId(member.id)}
                        disabled={isEditorOpen}
                        title={addDisabledTitle}
                      >
                        Editar
                      </button>
                      <button type="button" className="btn-danger" onClick={() => setPendingDeleteId(member.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingMember && (
        <Modal role="alertdialog" ariaLabel={`Editar a ${editingMember.name}`} size="xl">
          <MemberEditRow
            member={editingMember}
            allMembers={members}
            onSave={saveMember}
            onCancel={() => setEditingId(null)}
          />
        </Modal>
      )}

      {newDraft && (
        <Modal role="alertdialog" ariaLabel="Agregar integrante" size="xl">
          <MemberEditRow member={newDraft} allMembers={members} onSave={saveNewMember} onCancel={() => setNewDraft(null)} />
        </Modal>
      )}

      {memberPendingDelete && (
        <DeleteMemberConfirm
          member={memberPendingDelete}
          isOnlyMember={members.length === 1}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}

      <button
        type="button"
        className="btn-primary mt-4"
        onClick={addMember}
        disabled={isEditorOpen || members.length >= MAX_FAMILY_MEMBERS}
        title={addDisabledTitle}
      >
        Agregar integrante
      </button>
    </main>
  );
}
