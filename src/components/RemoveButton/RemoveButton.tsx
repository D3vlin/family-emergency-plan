interface RemoveButtonProps {
  onClick: () => void;
  label?: string;
}

export default function RemoveButton({ onClick, label = "Eliminar" }: RemoveButtonProps) {
  return (
    <button type="button" className="btn-danger" onClick={onClick}>
      {label}
    </button>
  );
}
