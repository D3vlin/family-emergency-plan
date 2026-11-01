import { useState } from "react";
import ConfirmDialog from "@components/ConfirmDialog/ConfirmDialog";
import Modal from "@components/Modal/Modal";
import StepPage from "@components/StepPage/StepPage";
import TableRowActions from "@components/TableRowActions/TableRowActions";
import { getAddDisabledTitle, newId } from "@utils/listEditor";
import { useWizard } from "@wizard/WizardContext";
import { createEmptyPet, MAX_PETS, type Pet } from "@wizard/pet";
import PetEditRow from "./PetEditRow";

function hasUnresolvedKitWarning(pet: Pet): boolean {
  return Object.values(pet.kit).some((entry) => entry.checked && !entry.expiryOrNotes.trim());
}

export default function Step9Pets() {
  const { planData, updateField } = useWizard();
  const pets = (planData.pets as Pet[] | undefined) ?? [];
  const notApplicable = Boolean(planData.petsNotApplicable);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingNotApplicable, setPendingNotApplicable] = useState(false);
  const [kitWarning, setKitWarning] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<Pet | null>(null);

  function setPets(next: Pet[]) {
    updateField("pets", next);
  }

  function addPet() {
    setNewDraft(createEmptyPet(newId()));
  }

  function saveNewPet(saved: Pet) {
    setKitWarning(
      hasUnresolvedKitWarning(saved) ? "Hay ítems del kit marcados SI sin fecha de vencimiento/observaciones." : null,
    );
    setPets([...pets, saved]);
    setNewDraft(null);
  }

  function savePet(saved: Pet) {
    setKitWarning(
      hasUnresolvedKitWarning(saved) ? "Hay ítems del kit marcados SI sin fecha de vencimiento/observaciones." : null,
    );
    setPets(pets.map((p) => (p.id === saved.id ? saved : p)));
    setEditingId(null);
  }

  function confirmDelete() {
    setPets(pets.filter((p) => p.id !== pendingDeleteId));
    setPendingDeleteId(null);
  }

  function requestNotApplicable() {
    if (pets.length > 0) {
      setPendingNotApplicable(true);
    } else {
      updateField("petsNotApplicable", true);
    }
  }

  function confirmNotApplicable() {
    setPets([]);
    updateField("petsNotApplicable", true);
    setPendingNotApplicable(false);
  }

  const petPendingDelete = pets.find((p) => p.id === pendingDeleteId);
  const editingPet = pets.find((p) => p.id === editingId);
  const isEditorOpen = newDraft !== null || editingId !== null;
  const addDisabledTitle = getAddDisabledTitle(isEditorOpen, pets.length >= MAX_PETS, "20 mascotas");

  return (
    <StepPage step={9}>
      <label htmlFor="pets-not-applicable" className="field-checkbox-row text-sm font-medium">
        <input
          id="pets-not-applicable"
          type="checkbox"
          checked={notApplicable}
          onChange={(e) => (e.target.checked ? requestNotApplicable() : updateField("petsNotApplicable", false))}
        />
        No aplica — mi familia no tiene mascotas
      </label>

      {pendingNotApplicable && (
        <ConfirmDialog
          ariaLabel="Confirmar que no aplica"
          onCancel={() => setPendingNotApplicable(false)}
          onConfirm={confirmNotApplicable}
        >
          <p className="text-sm">Esto va a borrar las mascotas ya cargadas. ¿Continuar?</p>
        </ConfirmDialog>
      )}

      {!notApplicable && (
        <div className="mt-4">
          {kitWarning && (
            <p role="status" className="alert-info mb-3">
              {kitWarning}
            </p>
          )}

          {pets.length === 0 ? (
            <p className="empty-state">Sin mascotas agregadas todavía.</p>
          ) : (
            <div className="table-wrapper">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="table-header-row">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Especie</th>
                    <th className="p-3">Veterinario</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.map((pet) => (
                    <tr key={pet.id} className="table-body-row">
                      <td className="table-cell">{pet.name}</td>
                      <td className="table-cell">{pet.species}</td>
                      <td className="table-cell">{pet.vetName || "—"}</td>
                      <td className="table-cell">
                        <TableRowActions
                          onEdit={() => setEditingId(pet.id)}
                          onDelete={() => setPendingDeleteId(pet.id)}
                          editDisabled={isEditorOpen}
                          editDisabledTitle={addDisabledTitle}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editingPet && (
            <Modal role="alertdialog" ariaLabel={`Editar a ${editingPet.name}`} size="lg">
              <PetEditRow pet={editingPet} onSave={savePet} onCancel={() => setEditingId(null)} />
            </Modal>
          )}

          {newDraft && (
            <Modal role="alertdialog" ariaLabel="Agregar mascota" size="lg">
              <PetEditRow pet={newDraft} onSave={saveNewPet} onCancel={() => setNewDraft(null)} />
            </Modal>
          )}

          {petPendingDelete && (
            <ConfirmDialog
              ariaLabel={`Eliminar a ${petPendingDelete.name}`}
              onCancel={() => setPendingDeleteId(null)}
              onConfirm={confirmDelete}
              confirmLabel="Eliminar"
            >
              <p className="font-medium text-slate-800 dark:text-slate-200">¿Eliminar a {petPendingDelete.name}?</p>
            </ConfirmDialog>
          )}

          <button
            type="button"
            className="btn-primary mt-4"
            onClick={addPet}
            disabled={isEditorOpen || pets.length >= MAX_PETS}
            title={addDisabledTitle}
          >
            Agregar mascota
          </button>
        </div>
      )}
    </StepPage>
  );
}
