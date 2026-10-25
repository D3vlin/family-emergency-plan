import ConfirmDialog from "@components/ConfirmDialog/ConfirmDialog";
import type { FamilyMember } from "@wizard/familyMember";

interface DeleteMemberConfirmProps {
  member: FamilyMember;
  isOnlyMember: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteMemberConfirm({ member, isOnlyMember, onConfirm, onCancel }: DeleteMemberConfirmProps) {
  return (
    <ConfirmDialog ariaLabel={`Eliminar a ${member.name}`} onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Eliminar">
      <p className="font-medium text-slate-800 dark:text-slate-200">¿Eliminar a {member.name}?</p>
      <ul className="list-inside list-disc empty-state">
        <li>{member.illnesses.length} enfermedad(es)</li>
        <li>{member.medications.length} medicamento(s)</li>
        <li>{member.phones.length} teléfono(s)</li>
        <li>{member.disabilities.length} discapacidad(es)</li>
        <li>{member.frequentSites.length} sitio(s) frecuente(s)</li>
      </ul>
      {isOnlyMember && <p className="alert-error">Es el único integrante — la lista quedará vacía.</p>}
    </ConfirmDialog>
  );
}
