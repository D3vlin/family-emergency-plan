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
import { clearPlan, loadPlan, savePlan, STORAGE_KEY } from "@storage/planStorage";
import { registerTab } from "@storage/tabRegistry";
import { claimExclusiveEditing, isLockedByAnotherTab, releaseExclusiveEditingIfOwner, TAB_LOCK_KEY } from "@storage/tabLock";
import { computeFurthestAllowedStep, isStepValid, STEP_HEADER, TOTAL_STEPS, type PlanData } from "./stepValidators";
import { normalizeMember } from "./familyMember";
import { INACTIVITY_EXPIRE_MS } from "@constants/timing";

function normalizePlanData(data: PlanData): PlanData {
  if (!Array.isArray(data.familyMembers)) return data;
  return { ...data, familyMembers: data.familyMembers.map(normalizeMember) };
}

export type Screen = "home" | number | "review";

function screenToPath(screen: Screen): string {
  if (screen === "home") return "/";
  if (screen === "review") return "/review";
  return `/step/${screen}`;
}

function pathToScreen(path: string): Screen {
  if (path === "/review") return "review";
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
  crossTabChangeDetected: boolean;
  lockedOut: boolean;
  takeOverAsOnlyEditor: () => void;
  isEditingFromReview: boolean;
  startSectionEdit: (step: number) => void;
  returnToReview: () => void;
  consumeReviewFocusStep: () => number | null;
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
    data: normalizePlanData(plan.data as PlanData),
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
  const [crossTabChangeDetected, setCrossTabChangeDetected] = useState(false);
  const [lockedOut, setLockedOut] = useState(() => isLockedByAnotherTab());
  const [reviewEditOrigin, setReviewEditOrigin] = useState<number | null>(null);
  const [reviewFocusStep, setReviewFocusStep] = useState<number | null>(null);
  const touchedStepsRef = useRef<Set<number>>(new Set());
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
      const arrivingAtStep = currentScreen === "review" ? TOTAL_STEPS + 1 : currentScreen;
      const confirmed = (nextData.confirmedSteps as number[] | undefined) ?? [];
      if (arrivingAtStep > leftScreen && isStepValid(leftScreen, nextData) && !confirmed.includes(leftScreen)) {
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
      releaseExclusiveEditingIfOwner();
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  useEffect(() => {
    function handleStorageEvent(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setCrossTabChangeDetected(true);
      if (event.key === TAB_LOCK_KEY) {
        const nowLocked = isLockedByAnotherTab();
        setLockedOut(nowLocked);
        if (!nowLocked) {
          const fresh = loadPlan();
          if (fresh) setPlanData(normalizePlanData(fresh.data as PlanData));
        }
      }
    }
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);

  useEffect(() => {
    if (reviewEditOrigin === null) return;
    if (typeof currentScreen === "number") touchedStepsRef.current.add(currentScreen);
  }, [currentScreen, reviewEditOrigin]);

  const startSectionEdit = useCallback((step: number) => {
    touchedStepsRef.current = new Set([step]);
    setReviewEditOrigin(step);
    setCurrentScreen(step);
  }, []);

  const returnToReview = useCallback(() => {
    const touched = touchedStepsRef.current;
    setReviewFocusStep(touched.size === 1 ? reviewEditOrigin : null);
    setReviewEditOrigin(null);
    touchedStepsRef.current = new Set();
    setCurrentScreen("review");
  }, [reviewEditOrigin]);

  const consumeReviewFocusStep = useCallback(() => {
    const step = reviewFocusStep;
    setReviewFocusStep(null);
    return step;
  }, [reviewFocusStep]);

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

  const takeOverAsOnlyEditor = useCallback(() => {
    const fresh = loadPlan();
    if (fresh) setPlanData(normalizePlanData(fresh.data as PlanData));
    claimExclusiveEditing();
    setLockedOut(false);
    setCrossTabChangeDetected(false);
  }, []);

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
    crossTabChangeDetected,
    lockedOut,
    takeOverAsOnlyEditor,
    isEditingFromReview: reviewEditOrigin !== null,
    startSectionEdit,
    returnToReview,
    consumeReviewFocusStep,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) throw new Error("useWizard must be used within a WizardProvider");
  return context;
}
