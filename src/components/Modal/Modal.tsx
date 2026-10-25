import type { ReactNode } from "react";

interface ModalProps {
  role: "alertdialog" | "status";
  ariaLabel?: string;
  children: ReactNode;
  size?: "sm" | "lg" | "xl";
}

const SIZE_CLASS: Record<"sm" | "lg" | "xl", string> = {
  sm: "",
  lg: "modal-content-lg",
  xl: "modal-content-xl",
};

export default function Modal({ role, ariaLabel, children, size = "sm" }: ModalProps) {
  return (
    <div role={role} aria-label={ariaLabel} className="modal-backdrop">
      <div className={`modal-content space-y-3 ${SIZE_CLASS[size]}`}>{children}</div>
    </div>
  );
}
