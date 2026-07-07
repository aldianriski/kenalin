/**
 * Idle timer (TASK-012). After `nudgeMs` of inactivity it fires `onNudge` ("still
 * there?"), then after a further `closeMs` fires `onClose` (auto-minimize). `kick()`
 * resets it on any user activity; `stop()` cancels everything.
 *
 * Pure w.r.t. the DOM (uses only setTimeout/clearTimeout) so it unit-tests with fake
 * timers. Motion is a CSS concern (prefers-reduced-motion) — this only schedules.
 */
export interface IdleTimerOptions {
  /** Inactivity before the nudge. */
  nudgeMs: number;
  /** Additional delay AFTER the nudge before auto-minimize. */
  closeMs: number;
  onNudge: () => void;
  onClose: () => void;
}

export interface IdleTimer {
  /** Reset — call on user activity. */
  kick: () => void;
  /** Cancel all pending timers. */
  stop: () => void;
}

export function createIdleTimer(opts: IdleTimerOptions): IdleTimer {
  let nudgeT: ReturnType<typeof setTimeout> | undefined;
  let closeT: ReturnType<typeof setTimeout> | undefined;

  const stop = (): void => {
    if (nudgeT !== undefined) clearTimeout(nudgeT);
    if (closeT !== undefined) clearTimeout(closeT);
    nudgeT = undefined;
    closeT = undefined;
  };

  const kick = (): void => {
    stop();
    nudgeT = setTimeout(() => {
      opts.onNudge();
      closeT = setTimeout(() => opts.onClose(), opts.closeMs);
    }, opts.nudgeMs);
  };

  return { kick, stop };
}
