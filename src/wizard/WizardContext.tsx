import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useInactivityTimer } from "@hooks/useInactivityTimer";
import { clearPlan, loadPlan, savePlan } from "@storage/planStorage";
import { registerTab } from "@storage/tabRegistry";
import { computeFurthestAllowedStep, isStepValid, STEP_HEADER, type PlanData } from "./stepValidators";
import { INACTIVITY_EXPIRE_MS } from "@constants/timing";

export type Screen = "home" | number;

function screenToPath(screen: Screen): string {
  if (screen === "home") return "/";
  return `/step/${screen}`;
}

function pathToScreen(path: string): Screen {
  const match = path.match(/^\/step\/(\d+)$/);
  return match ? Number(match[1]) : "home";
}

interface WizardContextValue {
  planData: PlanData;
  updateField: (section: string, value: unknown) => void;
  currentScreen: Screen;
  goTo: (screen: Screen) => void;
  furthestAllowedStep: number;
  warningVisible: boolean;
  dismissWarning: () => void;
  expiredRedirectVisible: boolean;
  restartPlan: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

function loadInitialState() {
  const plan = loadPlan();
  if (!plan) return { data: {} as PlanData, lastVisitedPath: `/step/${STEP_HEADER}`, hasExistingPlan: false };

  const isExpired = Date.now() - plan.lastActivityAt >= INACTIVITY_EXPIRE_MS;
  if (isExpired) {
    clearPlan();
    return { data: {} as PlanData, lastVisitedPath: `/step/${STEP_HEADER}`, hasExistingPlan: false };
  }

  return {
    data: plan.data as PlanData,
    lastVisitedPath: plan.lastVisitedPath,
    hasExistingPlan: true,
  };
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadInitialState());

  const [planData, setPlanData] = useState<PlanData>(initial.current.data);
  
  const [currentScreen, setCurrentScreen] = useState<Screen>(() =>
    initial.current.hasExistingPlan ? pathToScreen(initial.current.lastVisitedPath) : "home",
  );
  const [warningVisible, setWarningVisible] = useState(false);
  const [expiredRedirectVisible, setExpiredRedirectVisible] = useState(false);
  const previousScreenRef = useRef<Screen | null>(null);

  const goTo = useCallback((next: Screen) => setCurrentScreen(next), []);

  const persist = useCallback((data: PlanData, path: string) => {
    savePlan({ data, lastVisitedPath: path, lastActivityAt: Date.now() });
  }, []);

  const handleExpire = useCallback(() => {
    clearPlan();
    setWarningVisible(false);
    setExpiredRedirectVisible(true);
  }, []);

  const { registerActivity } = useInactivityTimer({
    enabled: true,
    onWarning: () => setWarningVisible(true),
    onExpire: handleExpire,
  });

  const furthestAllowedStep = useMemo(() => computeFurthestAllowedStep(planData), [planData]);

  useEffect(() => {
    if (currentScreen === "home") return;
    let nextData = planData;

    const leftScreen = previousScreenRef.current;
    if (typeof leftScreen === "number") {
      const confirmed = (nextData.confirmedSteps as number[] | undefined) ?? [];
      if (
        typeof currentScreen === "number" &&
        currentScreen > leftScreen &&
        isStepValid(leftScreen, nextData) &&
        !confirmed.includes(leftScreen)
      ) {
        nextData = { ...nextData, confirmedSteps: [...confirmed, leftScreen].sort((a, b) => a - b) };
      }
    }
    previousScreenRef.current = currentScreen;

    if (typeof currentScreen === "number") {
      const visited = (nextData.visitedSteps as number[] | undefined) ?? [];
      if (currentScreen <= furthestAllowedStep && !visited.includes(currentScreen)) {
        nextData = { ...nextData, visitedSteps: [...visited, currentScreen].sort((a, b) => a - b) };
      }
    }
    if (nextData !== planData) setPlanData(nextData);
    persist(nextData, screenToPath(currentScreen));
    registerActivity();
  }, [currentScreen]);

  useEffect(() => {
    const unregisterTab = registerTab();
    function handleUnload() {
      unregisterTab();
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  const updateField = useCallback(
    (section: string, value: unknown) => {
      setPlanData((previous) => {
        const next = { ...previous, [section]: value };
        persist(next, screenToPath(currentScreen));
        return next;
      });
      registerActivity();
    },
    [currentScreen, persist, registerActivity],
  );

  const dismissWarning = useCallback(() => {
    setWarningVisible(false);
    registerActivity();
  }, [registerActivity]);

  const restartPlan = useCallback(() => {
    clearPlan();
    setPlanData({});
    setExpiredRedirectVisible(false);
    setWarningVisible(false);
    setCurrentScreen(STEP_HEADER);
  }, []);

  const value: WizardContextValue = {
    planData,
    updateField,
    currentScreen,
    goTo,
    furthestAllowedStep,
    warningVisible,
    dismissWarning,
    expiredRedirectVisible,
    restartPlan,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) throw new Error("useWizard must be used within a WizardProvider");
  return context;
}
