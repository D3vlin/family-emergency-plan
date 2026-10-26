interface ModalFormActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmDisabledTitle?: string;
}

export default function ModalFormActions({
  onCancel,
  onConfirm,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmDisabled,
  confirmDisabledTitle,
}: ModalFormActionsProps) {
  return (
    <div className="modal-actions">
      <button type="button" className="btn-secondary" onClick={onCancel}>
        {cancelLabel}
      </button>
      <button
        type="button"
        className="btn-primary"
        disabled={confirmDisabled}
        title={confirmDisabled ? confirmDisabledTitle : undefined}
        onClick={onConfirm}
      >
        {confirmLabel}
      </button>
    </div>
  );
}
