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
  multiline?: boolean;
  rows?: number;
  hideLabel?: boolean;
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
  multiline = false,
  rows,
  hideLabel = false,
}: TextFieldProps) {
  const className = `field-input ${error ? "field-input-invalid" : ""}`;
  const labelClassName = hideLabel ? "sr-only" : required ? "field-label field-label-required" : "field-label";

  return (
    <>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className={className}
          rows={rows}
          maxLength={maxLength}
          required={required}
          aria-required={required}
          aria-invalid={error ? "true" : undefined}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className={className}
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
      )}
      {error && (
        <p role="alert" className="field-error-text">
          {error}
        </p>
      )}
    </>
  );
}
