import { useCallback, useEffect, useRef } from "react";
import { INACTIVITY_EXPIRE_MS, INACTIVITY_WARNING_MS } from "@constants/timing";

interface UseInactivityTimerOptions {
  enabled: boolean;
  onWarning: () => void;
  onExpire: () => void;
}

/**
 * Warns at 13 minutes of inactivity, expires at 15. Any registered activity
 * resets both timers — typing never lets the countdown reach the warning,
 * since activity keeps pushing it back.
 */
export function useInactivityTimer({ enabled, onWarning, onExpire }: UseInactivityTimerOptions) {
  const warningId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const expireId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const registerActivity = useCallback(() => {
    clearTimeout(warningId.current);
    clearTimeout(expireId.current);
    if (!enabled) return;
    warningId.current = setTimeout(onWarning, INACTIVITY_WARNING_MS);
    expireId.current = setTimeout(onExpire, INACTIVITY_EXPIRE_MS);
  }, [enabled, onWarning, onExpire]);

  useEffect(() => {
    registerActivity();
    return () => {
      clearTimeout(warningId.current);
      clearTimeout(expireId.current);
    };
  }, [registerActivity]);

  return { registerActivity };
}
