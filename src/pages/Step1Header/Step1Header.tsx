import StepPage from "@components/StepPage/StepPage";
import TextField from "@components/TextField/TextField";
import { MAX_FIELD_LENGTH } from "@constants/fieldLimits";
import { useWizard } from "@wizard/WizardContext";
import type { HeaderStepData } from "@wizard/stepValidators";

export default function Step1Header() {
  const { planData, updateField } = useWizard();
  const header = (planData.header as HeaderStepData | undefined) ?? {};

  function handleChange(field: keyof HeaderStepData, value: string) {
    updateField("header", { ...header, [field]: value });
  }

  return (
    <StepPage step={1}>
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
    </StepPage>
  );
}
