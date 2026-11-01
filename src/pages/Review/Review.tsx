import { useEffect, useRef, type ReactNode } from "react";
import TextField from "@components/TextField/TextField";
import { isNextReviewDateValid, todayDateString, tomorrowDateString, type ClosingData } from "@wizard/closing";
import type { Contact } from "@wizard/contact";
import type { FamilyMember } from "@wizard/familyMember";
import { formatPhoneForDisplay } from "@wizard/formatPhone";
import type { Pet } from "@wizard/pet";
import {
  countHousingGood,
  countKitChecked,
  RISK_FIELDS,
  TOTAL_HOUSING_ITEMS,
  TOTAL_KIT_ITEMS,
  unresolvedPetKitItems,
} from "@wizard/reviewSummary";
import { isStepValid, type HeaderStepData, type PlanData } from "@wizard/stepValidators";
import { useWizard } from "@wizard/WizardContext";
import type { RisksData } from "@pages/Step6Risks/Step6Risks";
import type { EmergencyKitData } from "@pages/Step7EmergencyKit/Step7EmergencyKit";
import type { HousingCheckData } from "@pages/Step8HousingCheck/Step8HousingCheck";

interface SectionProps {
  step: number;
  title: string;
  planData: PlanData;
  onEdit: (step: number) => void;
  children: ReactNode;
}

function Section({ step, title, planData, onEdit, children }: SectionProps) {
  const invalid = !isStepValid(step, planData);
  return (
    <section data-testid={`review-section-${step}`} className="card mb-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="section-title mt-0">{title}</h2>
        <button
          type="button"
          className={invalid ? "btn-danger shrink-0" : "btn-secondary shrink-0"}
          onClick={() => onEdit(step)}
          data-highlighted={invalid ? "true" : "false"}
        >
          Editar
        </button>
      </div>
      {invalid && (
        <p role="alert" className="alert-error mb-2">
          Este paso quedó incompleto. Revisalo antes de continuar.
        </p>
      )}
      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </section>
  );
}

export default function Review() {
  const { planData, updateField, startSectionEdit, consumeReviewFocusStep } = useWizard();
  const hasFocusedRef = useRef(false);

  useEffect(() => {
    if (hasFocusedRef.current) return;
    hasFocusedRef.current = true;
    const step = consumeReviewFocusStep();
    if (step === null) return;
    const section = document.querySelector(`[data-testid="review-section-${step}"]`);
    if (!section) return;
    section.scrollIntoView();
    const progressBar = document.querySelector('nav[aria-label="Progreso del plan"]');
    const stickyOffset = progressBar?.getBoundingClientRect().height ?? 0;
    if (stickyOffset > 0) window.scrollBy({ top: -stickyOffset });
  }, []);

  const header = (planData.header as HeaderStepData | undefined) ?? {};
  const members = (planData.familyMembers as FamilyMember[] | undefined) ?? [];
  const contacts = (planData.contacts as Contact[] | undefined) ?? [];
  const disabilitiesNotApplicable = Boolean(planData.disabilitiesNotApplicable);
  const risks = (planData.risks as RisksData | undefined) ?? {};
  const emergencyKit = (planData.emergencyKit as EmergencyKitData | undefined) ?? {};
  const housingCheck = (planData.housingCheck as HousingCheckData | undefined) ?? {};
  const petsNotApplicable = Boolean(planData.petsNotApplicable);
  const pets = (planData.pets as Pet[] | undefined) ?? [];
  const closing = (planData.closing as ClosingData | undefined) ?? {};

  useEffect(() => {
    if (!closing.lastReviewDate) {
      updateField("closing", { ...closing, lastReviewDate: todayDateString() });
    }
  }, []);

  const membersWithDisabilities = members.filter((m) => m.disabilities.length > 0).length;
  const housingGoodCount = countHousingGood(housingCheck);
  const petsWithUnresolvedKit = pets.flatMap((pet) => unresolvedPetKitItems(pet).map((item) => ({ pet, item })));

  const nextReviewDate = closing.nextReviewDate ?? "";
  const nextReviewError = nextReviewDate !== "" && !isNextReviewDateValid(nextReviewDate);

  return (
    <main>
      <h1 className="page-title">Revisión final</h1>

      <p className="alert-info mb-4">
        {members.length} integrante{members.length === 1 ? "" : "s"}
        {pets.length > 0 && (
          <>
            , {pets.length} mascota{pets.length === 1 ? "" : "s"}
          </>
        )}
        , {membersWithDisabilities} persona
        {membersWithDisabilities === 1 ? "" : "s"} con discapacidad.
      </p>

      <Section step={1} title="Encabezado" planData={planData} onEdit={startSectionEdit}>
        <p>Nombre del plan: {header.planName || "(sin completar)"}</p>
        <p>Dirección: {header.address || "(sin completar)"}</p>
      </Section>

      <Section step={2} title="Grupo familiar" planData={planData} onEdit={startSectionEdit}>
        <ul className="list-inside list-disc space-y-0.5">
          {members.map((member) => (
            <li key={member.id}>
              {member.name} — {member.relationship || "(sin relación)"}
            </li>
          ))}
        </ul>
      </Section>

      <Section step={3} title="Teléfonos importantes" planData={planData} onEdit={startSectionEdit}>
        {contacts.length === 0 ? (
          <p>Sin contactos adicionales agregados</p>
        ) : (
          <ul className="list-inside list-disc space-y-0.5">
            {contacts.map((contact) => (
              <li key={contact.id}>
                {contact.name} — {formatPhoneForDisplay(contact.phone)}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section step={4} title="Personas con discapacidad" planData={planData} onEdit={startSectionEdit}>
        {disabilitiesNotApplicable ? (
          <p>No aplica</p>
        ) : (
          <ul className="list-inside list-disc space-y-0.5">
            {members
              .filter((m) => m.disabilities.length > 0)
              .map((member) => (
                <li key={member.id}>
                  {member.name}: {member.disabilities.map((d) => d.type).join(", ")}
                </li>
              ))}
          </ul>
        )}
      </Section>

      <Section step={5} title="Sitios y personas frecuentes" planData={planData} onEdit={startSectionEdit}>
        <ul className="list-inside list-disc space-y-0.5">
          {members.map((member) => (
            <li key={member.id}>
              {member.name}: {member.frequentSites.length} sitio{member.frequentSites.length === 1 ? "" : "s"}
            </li>
          ))}
        </ul>
      </Section>

      <Section step={6} title="Riesgos y puntos de encuentro" planData={planData} onEdit={startSectionEdit}>
        {RISK_FIELDS.map(({ key, label }) => (
          <p key={key}>
            {label}: {risks[key] || "(sin completar)"}
          </p>
        ))}
      </Section>

      <Section step={7} title="Maletín de emergencias" planData={planData} onEdit={startSectionEdit}>
        <p>
          Completados {countKitChecked(emergencyKit)} de {TOTAL_KIT_ITEMS}
        </p>
      </Section>

      <Section step={8} title="Verificación de la vivienda" planData={planData} onEdit={startSectionEdit}>
        <p>
          {housingGoodCount} ítem{housingGoodCount === 1 ? "" : "s"} en buen estado de {TOTAL_HOUSING_ITEMS}
        </p>
      </Section>

      <Section step={9} title="Mascotas" planData={planData} onEdit={startSectionEdit}>
        {petsNotApplicable ? (
          <p>No aplica</p>
        ) : (
          <>
            {petsWithUnresolvedKit.length > 0 && (
              <p>
                Tenés {petsWithUnresolvedKit.length} ítem{petsWithUnresolvedKit.length === 1 ? "" : "s"} del kit sin
                fecha de vencimiento registrada.
              </p>
            )}
            <ul className="list-inside list-disc space-y-0.5">
              {pets.map((pet) => (
                <li key={pet.id}>
                  {pet.name} — {pet.species}
                  {unresolvedPetKitItems(pet).length > 0 && (
                    <ul className="list-inside list-disc space-y-0.5">
                      {unresolvedPetKitItems(pet).map((item) => (
                        <li key={item} role="status">
                          {item}: sin fecha de vencimiento/observaciones
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <section data-testid="review-section-closing" className="card mb-3">
        <h2 className="section-title mt-0">Cierre</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Última revisión: hoy ({closing.lastReviewDate || todayDateString()})
        </p>

        <TextField
          id="next-review-date"
          label="Fecha de próxima revisión"
          type="date"
          min={tomorrowDateString()}
          error={nextReviewError ? "La fecha de próxima revisión debe ser una fecha futura." : undefined}
          value={nextReviewDate}
          onChange={(value) => updateField("closing", { ...closing, nextReviewDate: value })}
        />
      </section>
    </main>
  );
}
