import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createIdleTimer } from "./idle.js";

describe("createIdleTimer (TASK-012)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires onNudge after nudgeMs, then onClose after a further closeMs", () => {
    const onNudge = vi.fn();
    const onClose = vi.fn();
    const t = createIdleTimer({ nudgeMs: 1000, closeMs: 500, onNudge, onClose });
    t.kick();

    vi.advanceTimersByTime(999);
    expect(onNudge).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onNudge).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("kick() resets the countdown, preventing the nudge", () => {
    const onNudge = vi.fn();
    const onClose = vi.fn();
    const t = createIdleTimer({ nudgeMs: 1000, closeMs: 500, onNudge, onClose });
    t.kick();
    vi.advanceTimersByTime(900);
    t.kick(); // activity — restart
    vi.advanceTimersByTime(900);
    expect(onNudge).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onNudge).toHaveBeenCalledTimes(1);
  });

  it("stop() cancels a pending nudge and a pending close", () => {
    const onNudge = vi.fn();
    const onClose = vi.fn();
    const t = createIdleTimer({ nudgeMs: 1000, closeMs: 500, onNudge, onClose });
    t.kick();
    vi.advanceTimersByTime(1000);
    expect(onNudge).toHaveBeenCalledTimes(1);
    t.stop(); // cancel before auto-close
    vi.advanceTimersByTime(1000);
    expect(onClose).not.toHaveBeenCalled();
  });
});
