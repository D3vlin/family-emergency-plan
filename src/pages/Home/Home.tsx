import CitationFooter from "@components/CitationFooter/CitationFooter";
import { useWizard } from "@wizard/WizardContext";
import { STEP_HEADER } from "@wizard/stepValidators";

export default function Home() {
  const { goTo } = useWizard();
  return (
    <div className="home-shell">
      <p className="home-eyebrow">Inspirado en el formato oficial de la UNGRD</p>
      <h1 className="home-title">Plan Familiar de Emergencias</h1>
      <p className="home-subtitle">
        Un wizard de 9 pasos para armar el plan de tu familia: contactos, personas con cuidados especiales, mascotas,
        riesgos y punto de encuentro.
      </p>
      <button type="button" onClick={() => goTo(STEP_HEADER)} className="btn-primary home-cta">
        Comenzar
      </button>
      <div className="home-trust-note">
        <p>
          Tus datos se guardan solo en este navegador, nunca en un servidor. Se borran al cerrar esta pestaña y
          expiran a los 15 minutos de inactividad.
        </p>
        <p>Esta web no es una herramienta oficial de la UNGRD: es una iniciativa independiente que replica su formato con fines de utilidad pública.</p>
      </div>
      <CitationFooter />
    </div>
  );
}
