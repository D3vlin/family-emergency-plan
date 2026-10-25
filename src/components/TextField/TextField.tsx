interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
  error?: string;
  inputMode?: "text" | "numeric";
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function TextField({
  id,
  label,
  value,
  onChange,
  required = true,
  maxLength,
  error,
  inputMode,
  disabled,
  placeholder,
  autoFocus,
}: TextFieldProps) {
  return (
    <>
      <label htmlFor={id} className={required ? "field-label field-label-required" : "field-label"}>
        {label}
      </label>
      <input
        id={id}
        className={`field-input ${error ? "field-input-invalid" : ""}`}
        maxLength={maxLength}
        required={required}
        aria-required={required}
        aria-invalid={error ? "true" : undefined}
        inputMode={inputMode}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p role="alert" className="field-error-text">
          {error}
        </p>
      )}
    </>
  );
}
