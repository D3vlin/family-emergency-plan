interface AddIconButtonProps {
  label: string;
  onClick: () => void;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export default function AddIconButton({ label, onClick }: AddIconButtonProps) {
  return (
    <button type="button" className="btn-secondary mt-2" aria-label={label} title={label} onClick={onClick}>
      <PlusIcon />
    </button>
  );
}
