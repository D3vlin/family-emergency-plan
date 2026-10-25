interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
  error?: string;
}

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required = true,
  error,
}: SelectFieldProps) {
  return (
    <>
      <label htmlFor={id} className={required ? "field-label field-label-required" : "field-label"}>
        {label}
      </label>
      <select
        id={id}
        className={`field-input ${error ? "field-input-invalid" : ""}`}
        required={required}
        aria-required={required}
        aria-invalid={error ? "true" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="field-error-text">
          {error}
        </p>
      )}
    </>
  );
}
