interface RemoveLinkButtonProps {
  onClick: () => void;
  label?: string;
}

export default function RemoveLinkButton({ onClick, label = "Quitar" }: RemoveLinkButtonProps) {
  return (
    <button type="button" className="btn-link" onClick={onClick}>
      {label}
    </button>
  );
}
