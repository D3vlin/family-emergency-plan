import { useEffect } from "react";
import CitationFooter from "@components/CitationFooter/CitationFooter";
import ExpirationModals from "@components/ExpirationModals/ExpirationModals";
import Modal from "@components/Modal/Modal";
import ProgressBar from "@components/ProgressBar/ProgressBar";
import WizardNav from "@components/WizardNav/WizardNav";
import Step1Header from "@pages/Step1Header/Step1Header";
import Step2FamilyMembers from "@pages/Step2FamilyMembers/Step2FamilyMembers";
import Step3Contacts from "@pages/Step3Contacts/Step3Contacts";
import Step4Disabilities from "@pages/Step4Disabilities/Step4Disabilities";
import Step5FrequentSites from "@pages/Step5FrequentSites/Step5FrequentSites";
import Step6Risks from "@pages/Step6Risks/Step6Risks";
import Step7EmergencyKit from "@pages/Step7EmergencyKit/Step7EmergencyKit";
import Step8HousingCheck from "@pages/Step8HousingCheck/Step8HousingCheck";
import Step9Pets from "@pages/Step9Pets/Step9Pets";
import { isStepValid, TOTAL_STEPS } from "./stepValidators";
import { useWizard } from "./WizardContext";

const STEP_SCREENS = [
  Step1Header,
  Step2FamilyMembers,
  Step3Contacts,
  Step4Disabilities,
  Step5FrequentSites,
  Step6Risks,
  Step7EmergencyKit,
  Step8HousingCheck,
  Step9Pets,
];

export default function WizardLayout() {
  const {
    planData,
    furthestAllowedStep,
    currentScreen,
    goTo,
    warningVisible,
    dismissWarning,
    expiredRedirectVisible,
    restartPlan,
    crossTabChangeDetected,
    lockedOut,
    takeOverAsOnlyEditor,
  } = useWizard();

  const requestedStep = currentScreen as number;

  useEffect(() => {
    if (requestedStep > furthestAllowedStep) {
      goTo(Math.min(furthestAllowedStep, TOTAL_STEPS));
    }
  }, [requestedStep, furthestAllowedStep, goTo]);

  const StepScreen = STEP_SCREENS[Math.min(requestedStep, TOTAL_STEPS) - 1];
  const isCurrentStepValid = isStepValid(requestedStep, planData);

  return (
    <>
      {crossTabChangeDetected && !lockedOut && (
        <div role="status" className="alert-info mx-auto my-2 max-w-4xl">
          <p>Este plan se está editando en otra pestaña con la misma web.</p>
          <button type="button" className="btn-secondary mt-2" onClick={takeOverAsOnlyEditor}>
            Trabajar solo desde aquí
          </button>
        </div>
      )}
      <ProgressBar
        planData={planData}
        furthestAllowedStep={furthestAllowedStep}
        currentStep={requestedStep}
        onSelectStep={goTo}
      />
      <div className="page-shell">
        <div key={String(currentScreen)} className="step-transition">
          <StepScreen />
        </div>
        <WizardNav
          currentStep={requestedStep}
          isCurrentStepValid={isCurrentStepValid}
          onPrevious={() => goTo(requestedStep - 1)}
          onNext={() => isCurrentStepValid && goTo(requestedStep + 1)}
        />
      </div>
      <ExpirationModals
        warningVisible={warningVisible}
        onContinueWorking={dismissWarning}
        expiredRedirectVisible={expiredRedirectVisible}
        onGoToStart={restartPlan}
      />
      <CitationFooter />
      {lockedOut && (
        <Modal role="alertdialog" ariaLabel="Pestaña bloqueada">
          <div className="text-center">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Este plan ahora se edita solo desde otra pestaña. Podés cerrar esta pestaña — lo que ya guardaste no se
              pierde.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
