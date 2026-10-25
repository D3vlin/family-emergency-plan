import TextField from "@components/TextField/TextField";
import { MAX_FIELD_LENGTH } from "@constants/fieldLimits";
import { STEP_TITLES } from "@constants/stepTitles";
import { useWizard } from "@wizard/WizardContext";
import type { HeaderStepData } from "@wizard/stepValidators";

export default function Step1Header() {
  const { planData, updateField } = useWizard();
  const header = (planData.header as HeaderStepData | undefined) ?? {};

  function handleChange(field: keyof HeaderStepData, value: string) {
    updateField("header", { ...header, [field]: value });
  }

  return (
    <main>
      <h1 className="page-title">Paso 1 — {STEP_TITLES[0]}</h1>
      <form>
        <TextField
          id="plan-name"
          label="Nombre del plan"
          maxLength={MAX_FIELD_LENGTH}
          value={header.planName ?? ""}
          onChange={(value) => handleChange("planName", value)}
        />
        <TextField
          id="address"
          label="Dirección de la vivienda"
          maxLength={MAX_FIELD_LENGTH}
          value={header.address ?? ""}
          onChange={(value) => handleChange("address", value)}
        />
      </form>
    </main>
  );
}
