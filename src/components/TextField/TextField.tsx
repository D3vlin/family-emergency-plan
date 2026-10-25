interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
}

export default function TextField({ id, label, value, onChange, required = true, maxLength }: TextFieldProps) {
  return (
    <>
      <label htmlFor={id} className={required ? "field-label field-label-required" : "field-label"}>
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        maxLength={maxLength}
        required={required}
        aria-required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}
