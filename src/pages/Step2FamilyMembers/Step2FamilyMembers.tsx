import { useState } from "react";
import Modal from "@components/Modal/Modal";
import TableRowActions from "@components/TableRowActions/TableRowActions";
import { STEP_TITLES } from "@constants/stepTitles";
import { useWizard } from "@wizard/WizardContext";
import { createEmptyMember, MAX_FAMILY_MEMBERS, type FamilyMember } from "@wizard/familyMember";
import { getAddDisabledTitle, newId } from "@utils/listEditor";
import DeleteMemberConfirm from "./DeleteMemberConfirm";
import MemberEditRow from "./MemberEditRow";

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
  const addDisabledTitle = getAddDisabledTitle(isEditorOpen, members.length >= MAX_FAMILY_MEMBERS, "20 integrantes");

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
                  <td className="table-cell">{member.name}</td>
                  <td className="table-cell-muted">
                    {member.documentType} {member.documentNumber}
                  </td>
                  <td className="table-cell-muted">{member.relationship || "—"}</td>
                  <td className="table-cell-muted">{member.age || "—"}</td>
                  <td className="p-3 align-top">
                    <TableRowActions
                      onEdit={() => setEditingId(member.id)}
                      onDelete={() => setPendingDeleteId(member.id)}
                      editDisabled={isEditorOpen}
                      editDisabledTitle={addDisabledTitle}
                    />
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
