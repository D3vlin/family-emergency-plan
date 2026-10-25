import type { ReactNode } from "react";
import Modal from "@components/Modal/Modal";

interface ConfirmDialogProps {
  ariaLabel: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDialog({
  ariaLabel,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
}: ConfirmDialogProps) {
  return (
    <Modal role="alertdialog" ariaLabel={ariaLabel}>
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" autoFocus onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
