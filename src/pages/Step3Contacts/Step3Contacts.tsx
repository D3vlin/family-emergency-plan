import { useState } from "react";
import ConfirmDialog from "@components/ConfirmDialog/ConfirmDialog";
import Modal from "@components/Modal/Modal";
import TableRowActions from "@components/TableRowActions/TableRowActions";
import { STEP_TITLES } from "@constants/stepTitles";
import { formatPhoneForDisplay } from "@wizard/formatPhone";
import { useWizard } from "@wizard/WizardContext";
import { createEmptyContact, isDuplicatePhone, MAX_CONTACTS, type Contact } from "@wizard/contact";
import { getAddDisabledTitle, newId } from "@utils/listEditor";
import ContactEditRow from "./ContactEditRow";

export default function Step3Contacts() {
  const { planData, updateField } = useWizard();
  const contacts = (planData.contacts as Contact[] | undefined) ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<Contact | null>(null);

  function setContacts(next: Contact[]) {
    updateField("contacts", next);
  }

  function addContact() {
    setNewDraft(createEmptyContact(newId()));
  }

  function saveNewContact(saved: Contact) {
    setDuplicateWarning(isDuplicatePhone(contacts, saved) ? "Este teléfono ya está registrado en otro contacto." : null);
    setContacts([...contacts, saved]);
    setNewDraft(null);
  }

  function saveContact(saved: Contact) {
    setDuplicateWarning(isDuplicatePhone(contacts, saved) ? "Este teléfono ya está registrado en otro contacto." : null);
    setContacts(contacts.map((c) => (c.id === saved.id ? saved : c)));
    setEditingId(null);
  }

  function confirmDelete() {
    setContacts(contacts.filter((c) => c.id !== pendingDeleteId));
    setPendingDeleteId(null);
  }

  const contactPendingDelete = contacts.find((c) => c.id === pendingDeleteId);
  const editingContact = contacts.find((c) => c.id === editingId);
  const isEditorOpen = newDraft !== null || editingId !== null;
  const addDisabledTitle = getAddDisabledTitle(isEditorOpen, contacts.length >= MAX_CONTACTS, "20 contactos");

  return (
    <main>
      <h1 className="page-title">Paso 3 — {STEP_TITLES[2]}</h1>
      {duplicateWarning && (
        <p role="status" className="alert-info mb-3">
          {duplicateWarning}
        </p>
      )}

      {contacts.length === 0 ? (
        <p className="empty-state">Sin contactos adicionales agregados todavía.</p>
      ) : (
        <div className="table-wrapper">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="table-header-row">
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Relación</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="table-body-row">
                  <td className="table-cell">{contact.name}</td>
                  <td className="table-cell-muted">{formatPhoneForDisplay(contact.phone)}</td>
                  <td className="table-cell-muted">{contact.relationship || "—"}</td>
                  <td className="p-3 align-top">
                    <TableRowActions
                      onEdit={() => setEditingId(contact.id)}
                      onDelete={() => setPendingDeleteId(contact.id)}
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

      {editingContact && (
        <Modal role="alertdialog" ariaLabel={`Editar a ${editingContact.name}`}>
          <ContactEditRow contact={editingContact} onSave={saveContact} onCancel={() => setEditingId(null)} />
        </Modal>
      )}

      {newDraft && (
        <Modal role="alertdialog" ariaLabel="Agregar contacto">
          <ContactEditRow contact={newDraft} onSave={saveNewContact} onCancel={() => setNewDraft(null)} />
        </Modal>
      )}

      {contactPendingDelete && (
        <ConfirmDialog
          ariaLabel={`Eliminar a ${contactPendingDelete.name}`}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
          confirmLabel="Eliminar"
        >
          <p className="font-medium text-slate-800 dark:text-slate-200">¿Eliminar a {contactPendingDelete.name}?</p>
        </ConfirmDialog>
      )}

      <button
        type="button"
        className="btn-primary mt-4"
        onClick={addContact}
        disabled={isEditorOpen || contacts.length >= MAX_CONTACTS}
        title={addDisabledTitle}
      >
        Agregar contacto
      </button>
    </main>
  );
}
