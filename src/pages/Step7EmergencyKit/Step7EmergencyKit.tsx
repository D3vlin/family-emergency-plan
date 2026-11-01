import { useState } from "react";
import Modal from "@components/Modal/Modal";
import ModalFormActions from "@components/ModalFormActions/ModalFormActions";
import RemoveButton from "@components/RemoveButton/RemoveButton";
import SelectField from "@components/SelectField/SelectField";
import StepPage from "@components/StepPage/StepPage";
import { useWizard } from "@wizard/WizardContext";
import { COMPLEMENTARY_ITEMS, SURVIVAL_SUPPLIES } from "./emergencyKitItems";

export interface EmergencyKitData {
  survivalSupplies?: Record<string, boolean>;
  complementaryItems?: Record<string, boolean>;
}

type ListKey = "survivalSupplies" | "complementaryItems";

const LIST_CONFIG: Record<ListKey, { title: string; items: string[] }> = {
  survivalSupplies: { title: "Suministros de supervivencia", items: SURVIVAL_SUPPLIES },
  complementaryItems: { title: "Documentos y elementos complementarios", items: COMPLEMENTARY_ITEMS },
};

export default function Step7EmergencyKit() {
  const { planData, updateField } = useWizard();
  const kit = (planData.emergencyKit as EmergencyKitData | undefined) ?? {};
  const [addingList, setAddingList] = useState<ListKey | null>(null);
  const [selectedItem, setSelectedItem] = useState("");

  function listFor(key: ListKey): Record<string, boolean> {
    return kit[key] ?? {};
  }

  function addItem(key: ListKey, item: string) {
    updateField("emergencyKit", { ...kit, [key]: { ...listFor(key), [item]: true } });
  }

  function removeItem(key: ListKey, item: string) {
    const next = { ...listFor(key) };
    delete next[item];
    updateField("emergencyKit", { ...kit, [key]: next });
  }

  function openAdd(key: ListKey) {
    setSelectedItem("");
    setAddingList(key);
  }

  function cancelAdd() {
    setAddingList(null);
  }

  function submitAdd() {
    if (!addingList || !selectedItem) return;
    addItem(addingList, selectedItem);
    setAddingList(null);
  }

  return (
    <StepPage step={7}>
      {(Object.keys(LIST_CONFIG) as ListKey[]).map((key) => {
        const { title, items } = LIST_CONFIG[key];
        const current = listFor(key);
        const addedItems = items.filter((item) => current[item]);
        const availableItems = items.filter((item) => !current[item]);
        const atLimit = availableItems.length === 0;

        return (
          <fieldset key={key} className="card mt-4 first:mt-0">
            <legend className="section-title px-1">{title}</legend>

            {addedItems.length > 0 ? (
              <div className="table-wrapper">
                <table className="w-full min-w-[320px] border-collapse text-sm">
                  <thead>
                    <tr className="table-header-row-muted">
                      <th className="p-2">Elemento</th>
                      <th className="p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedItems.map((item) => (
                      <tr key={item} className="table-body-row">
                        <td className="table-cell">{item}</td>
                        <td className="p-2">
                          <RemoveButton onClick={() => removeItem(key, item)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">Sin ítems agregados todavía.</p>
            )}

            <button
              type="button"
              className="btn-secondary mt-2"
              disabled={atLimit}
              title={atLimit ? "Ya agregaste todos los ítems de esta lista" : undefined}
              onClick={() => openAdd(key)}
            >
              Agregar ítem
            </button>

            {addingList === key && (
              <Modal role="alertdialog" ariaLabel={`Agregar ítem — ${title}`}>
                <SelectField
                  id={`kit-item-${key}`}
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
          </fieldset>
        );
      })}
    </StepPage>
  );
}
