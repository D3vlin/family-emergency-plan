interface TableRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editDisabled?: boolean;
  editDisabledTitle?: string;
}

export default function TableRowActions({ onEdit, onDelete, editDisabled, editDisabledTitle }: TableRowActionsProps) {
  return (
    <div className="flex gap-2">
      <button type="button" className="btn-secondary" onClick={onEdit} disabled={editDisabled} title={editDisabledTitle}>
        Editar
      </button>
      <button type="button" className="btn-danger" onClick={onDelete}>
        Eliminar
      </button>
    </div>
  );
}
