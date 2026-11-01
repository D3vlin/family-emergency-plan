import TextField from "@components/TextField/TextField";

interface TableTextCellProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export default function TableTextCell({ id, label, value, onChange, maxLength, placeholder }: TableTextCellProps) {
  return (
    <td className="table-cell">
      <TextField
        id={id}
        label={label}
        hideLabel
        required={false}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </td>
  );
}
