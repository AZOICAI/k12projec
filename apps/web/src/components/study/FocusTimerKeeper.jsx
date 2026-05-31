"use client";

import { useEffect } from "react";
import {
  loadTimerState,
  reconcileRunningAway,
  saveTimerState,
} from "@/lib/study/timerStorage";

export const FOCUS_TIMER_TICK_EVENT = "k12-focus-timer-tick";

/** Keeps running timer state accurate while the user is on other app tabs. */
export function FocusTimerKeeper() {
  useEffect(() => {
    function tick() {
      const saved = loadTimerState();
      if (!saved?.running) return;

      const reconciled = reconcileRunningAway(saved);
      const changed =
        reconciled.secondsLeft !== saved.secondsLeft ||
        reconciled.runningSeconds !== saved.runningSeconds ||
        reconciled.running !== saved.running;

      if (changed) {
        saveTimerState(reconciled);
        window.dispatchEvent(new CustomEvent(FOCUS_TIMER_TICK_EVENT));
      }
    }

    const interval = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
