const STORAGE_KEY = "k12-focus-timer-v1";

export function loadTimerState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTimerState(state) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function clearTimerState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Apply wall-clock elapsed while user was away (tab switch) during a running session. */
export function reconcileRunningAway(saved, now = Date.now()) {
  if (!saved?.running || !saved.runningSince) return saved;

  const elapsed = Math.floor((now - saved.runningSince) / 1000);
  if (elapsed <= 0) return saved;

  const secondsLeft = Math.max(0, (saved.secondsLeft ?? 0) - elapsed);
  const runningSeconds = (saved.runningSeconds ?? 0) + elapsed;

  return {
    ...saved,
    secondsLeft,
    runningSeconds,
    runningSince: secondsLeft > 0 ? now : null,
    running: secondsLeft > 0,
  };
}
