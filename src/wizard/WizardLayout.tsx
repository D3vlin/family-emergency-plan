import { useEffect } from "react";
import CitationFooter from "@components/CitationFooter/CitationFooter";
import ExpirationModals from "@components/ExpirationModals/ExpirationModals";
import ProgressBar from "@components/ProgressBar/ProgressBar";
import WizardNav from "@components/WizardNav/WizardNav";
import Step1Header from "@pages/Step1Header/Step1Header";
import Step2FamilyMembers from "@pages/Step2FamilyMembers/Step2FamilyMembers";
import Step3Contacts from "@pages/Step3Contacts/Step3Contacts";
import { isStepValid, TOTAL_STEPS } from "./stepValidators";
import { useWizard } from "./WizardContext";

const STEP_SCREENS = [Step1Header, Step2FamilyMembers, Step3Contacts];

export default function WizardLayout() {
  const { planData, furthestAllowedStep, currentScreen, goTo, warningVisible, dismissWarning, expiredRedirectVisible, restartPlan } =
    useWizard();

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
    </>
  );
}
