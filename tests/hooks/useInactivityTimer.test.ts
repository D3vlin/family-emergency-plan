import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInactivityTimer } from "@hooks/useInactivityTimer";
import { INACTIVITY_EXPIRE_MS, INACTIVITY_WARNING_MS } from "@constants/timing";

describe("useInactivityTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls onWarning after 13 minutes of inactivity", () => {
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    renderHook(() => useInactivityTimer({ enabled: true, onWarning, onExpire }));

    vi.advanceTimersByTime(INACTIVITY_WARNING_MS);

    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("calls onExpire after 15 minutes of inactivity with no response", () => {
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    renderHook(() => useInactivityTimer({ enabled: true, onWarning, onExpire }));

    vi.advanceTimersByTime(INACTIVITY_EXPIRE_MS);

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("registering activity resets the countdown (typing never lets it reach 13 minutes)", () => {
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    const { result } = renderHook(() => useInactivityTimer({ enabled: true, onWarning, onExpire }));

    vi.advanceTimersByTime(INACTIVITY_WARNING_MS - 1000);
    result.current.registerActivity();
    vi.advanceTimersByTime(INACTIVITY_WARNING_MS - 1000);

    expect(onWarning).not.toHaveBeenCalled();
  });

  it("does not schedule anything while disabled", () => {
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    renderHook(() => useInactivityTimer({ enabled: false, onWarning, onExpire }));

    vi.advanceTimersByTime(INACTIVITY_EXPIRE_MS);

    expect(onWarning).not.toHaveBeenCalled();
    expect(onExpire).not.toHaveBeenCalled();
  });
});
