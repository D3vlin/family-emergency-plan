import { useState } from "react";
import Modal from "@components/Modal/Modal";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import RemoveButton from "@components/RemoveButton/RemoveButton";
import SelectField from "@components/SelectField/SelectField";
import StepPage from "@components/StepPage/StepPage";
import TableTextCell from "@components/TableTextCell/TableTextCell";
import { MAX_FIELD_LENGTH, MAX_SHORT_FIELD_LENGTH } from "@constants/fieldLimits";
import { useWizard } from "@wizard/WizardContext";
import HousingStatusCell from "./HousingStatusCell";
import { HOUSING_CHECK_ITEMS } from "./housingCheckItems";

export type HousingCheckStatus = "bueno" | "malo";

export interface HousingCheckEntry {
  status?: HousingCheckStatus;
  repairsNeeded?: string;
  deadline?: string;
  responsible?: string;
}

export type HousingCheckData = Record<string, HousingCheckEntry>;

export default function Step8HousingCheck() {
  const { planData, updateField } = useWizard();
  const housingCheck = (planData.housingCheck as HousingCheckData | undefined) ?? {};
  const [adding, setAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");

  function updateEntry(item: string, changes: Partial<HousingCheckEntry>) {
    const current = housingCheck[item] ?? {};
    updateField("housingCheck", { ...housingCheck, [item]: { ...current, ...changes } });
  }

  function removeItem(item: string) {
    const next = { ...housingCheck };
    delete next[item];
    updateField("housingCheck", next);
  }

  function openAdd() {
    setSelectedItem("");
    setAdding(true);
  }

  function cancelAdd() {
    setAdding(false);
  }

  function submitAdd() {
    if (!selectedItem) return;
    updateField("housingCheck", { ...housingCheck, [selectedItem]: housingCheck[selectedItem] ?? {} });
    setAdding(false);
  }

  const addedItems = HOUSING_CHECK_ITEMS.filter((item) => item in housingCheck);
  const availableItems = HOUSING_CHECK_ITEMS.filter((item) => !(item in housingCheck));

  return (
    <StepPage step={8}>
      {addedItems.length > 0 ? (
        <div className="table-wrapper">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="table-header-row">
                <th className="p-3">Ítem</th>
                <th className="p-3 field-label-required">Estado</th>
                <th className="p-3">Reparaciones necesarias</th>
                <th className="p-3">Plazo</th>
                <th className="p-3">Responsable</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {addedItems.map((item, index) => {
                const entry = housingCheck[item] ?? {};

                return (
                  <tr key={item} className="table-body-row">
                    <td className="table-cell">{item}</td>
                    <HousingStatusCell
                      index={index}
                      status={entry.status}
                      onChange={(status) => updateEntry(item, { status })}
                    />
                    <TableTextCell
                      id={`housing-repairs-${index}`}
                      label="Reparaciones necesarias"
                      maxLength={MAX_FIELD_LENGTH}
                      value={entry.repairsNeeded ?? ""}
                      onChange={(value) => updateEntry(item, { repairsNeeded: value })}
                    />
                    <TableTextCell
                      id={`housing-deadline-${index}`}
                      label="Plazo"
                      maxLength={MAX_SHORT_FIELD_LENGTH}
                      value={entry.deadline ?? ""}
                      onChange={(value) => updateEntry(item, { deadline: value })}
                    />
                    <TableTextCell
                      id={`housing-responsible-${index}`}
                      label="Responsable"
                      maxLength={MAX_SHORT_FIELD_LENGTH}
                      value={entry.responsible ?? ""}
                      onChange={(value) => updateEntry(item, { responsible: value })}
                    />
                    <td className="table-cell">
                      <RemoveButton onClick={() => removeItem(item)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">Sin ítems agregados todavía.</p>
      )}

      <button
        type="button"
        className="btn-secondary mt-3"
        disabled={availableItems.length === 0}
        title={availableItems.length === 0 ? "Ya agregaste todos los ítems" : undefined}
        onClick={openAdd}
      >
        Agregar ítem
      </button>

      {adding && (
        <Modal role="alertdialog" ariaLabel="Agregar ítem de verificación">
          <SelectField
            id="housing-item"
            label="Elemento"
            value={selectedItem}
            onChange={setSelectedItem}
            options={availableItems}
            placeholder="Seleccioná un ítem"
            autoFocus
          />
          <ModalFormActions
            onCancel={cancelAdd}
            onConfirm={submitAdd}
            confirmLabel="Agregar"
            confirmDisabled={!selectedItem}
            confirmDisabledTitle="Seleccioná un ítem para guardar"
          />
        </Modal>
      )}
    </StepPage>
  );
}
