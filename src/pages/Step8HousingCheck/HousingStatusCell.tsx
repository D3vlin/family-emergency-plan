import type { HousingCheckStatus } from "./Step8HousingCheck";

interface HousingStatusCellProps {
  index: number;
  status: HousingCheckStatus | undefined;
  onChange: (status: HousingCheckStatus) => void;
}

export default function HousingStatusCell({ index, status, onChange }: HousingStatusCellProps) {
  const groupName = `housing-status-${index}`;
  const goodId = `housing-good-${index}`;
  const badId = `housing-bad-${index}`;

  return (
    <td className="table-cell">
      <div className="field-checkbox-row">
        <input
          id={goodId}
          type="radio"
          name={groupName}
          required
          aria-required="true"
          checked={status === "bueno"}
          onChange={() => onChange("bueno")}
        />
        <label htmlFor={goodId}>Bueno</label>
      </div>
      <div className="field-checkbox-row">
        <input
          id={badId}
          type="radio"
          name={groupName}
          required
          aria-required="true"
          checked={status === "malo"}
          onChange={() => onChange("malo")}
        />
        <label htmlFor={badId}>Malo</label>
      </div>
    </td>
  );
}
