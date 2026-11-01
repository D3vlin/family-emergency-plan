import StepPage from "@components/StepPage/StepPage";
import TextField from "@components/TextField/TextField";
import { MAX_FIELD_LENGTH, MAX_LONG_FIELD_LENGTH } from "@constants/fieldLimits";
import { useWizard } from "@wizard/WizardContext";

export interface RisksData {
  insideRisks?: string;
  evacuationRoute?: string;
  surroundingHazards?: string;
  mainMeetingPoint?: string;
  alternateMeetingPoint?: string;
}

export default function Step6Risks() {
  const { planData, updateField } = useWizard();
  const risks = (planData.risks as RisksData | undefined) ?? {};

  function handleChange(field: keyof RisksData, value: string) {
    updateField("risks", { ...risks, [field]: value });
  }

  return (
    <StepPage step={6}>
      <TextField
        id="inside-risks"
        label="Riesgos al interior de la casa"
        required={false}
        multiline
        rows={3}
        maxLength={MAX_LONG_FIELD_LENGTH}
        value={risks.insideRisks ?? ""}
        onChange={(value) => handleChange("insideRisks", value)}
      />

      <TextField
        id="evacuation-route"
        label="Ruta de evacuación y peligros en los alrededores"
        required={false}
        multiline
        rows={3}
        maxLength={MAX_LONG_FIELD_LENGTH}
        value={risks.evacuationRoute ?? ""}
        onChange={(value) => handleChange("evacuationRoute", value)}
      />

      <TextField
        id="surrounding-hazards"
        label="Identificación de peligros alrededor de la vivienda"
        required={false}
        multiline
        rows={3}
        maxLength={MAX_LONG_FIELD_LENGTH}
        value={risks.surroundingHazards ?? ""}
        onChange={(value) => handleChange("surroundingHazards", value)}
      />

      <TextField
        id="main-meeting-point"
        label="Punto de encuentro principal"
        required={false}
        maxLength={MAX_FIELD_LENGTH}
        value={risks.mainMeetingPoint ?? ""}
        onChange={(value) => handleChange("mainMeetingPoint", value)}
      />

      <TextField
        id="alternate-meeting-point"
        label="Punto de encuentro alterno"
        required={false}
        maxLength={MAX_FIELD_LENGTH}
        value={risks.alternateMeetingPoint ?? ""}
        onChange={(value) => handleChange("alternateMeetingPoint", value)}
      />
    </StepPage>
  );
}
