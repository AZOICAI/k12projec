"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logStudySession } from "@/lib/study/logSession";
import { FOCUS_TIMER_TICK_EVENT } from "@/components/study/FocusTimerKeeper";
import {
  clearTimerState,
  loadTimerState,
  reconcileRunningAway,
  saveTimerState,
} from "@/lib/study/timerStorage";
import { Button } from "@/components/ui/Button";

function applySavedTimer(saved, setters) {
  const reconciled = reconcileRunningAway(saved);
  setters.setInputMinutes(reconciled.inputMinutes ?? 30);
  setters.setSecondsLeft(reconciled.secondsLeft ?? 30 * 60);
  setters.setRunning(Boolean(reconciled.running));
  setters.runningSecondsRef.current = reconciled.runningSeconds ?? 0;
  setters.loggedRef.current = Boolean(reconciled.logged);
  setters.runningSinceRef.current = reconciled.runningSince ?? null;
}

function buildPersisted(state) {
  return {
    inputMinutes: state.inputMinutes,
    secondsLeft: state.secondsLeft,
    running: state.running,
    runningSeconds: state.runningSeconds,
    logged: state.logged,
    runningSince: state.running ? state.runningSince : null,
  };
}

/** Countdown timer — persists in sessionStorage when you switch tabs. */
export function StudyTimer({ onSessionLogged }) {
  const [hydrated, setHydrated] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(30);
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(null);

  const runningSecondsRef = useRef(0);
  const runningSinceRef = useRef(null);
  const loggedRef = useRef(false);

  const persist = useCallback(() => {
    saveTimerState(
      buildPersisted({
        inputMinutes,
        secondsLeft,
        running,
        runningSeconds: runningSecondsRef.current,
        logged: loggedRef.current,
        runningSince: runningSinceRef.current,
      }),
    );
  }, [inputMinutes, secondsLeft, running]);

  useEffect(() => {
    const saved = loadTimerState();
    if (saved) {
      applySavedTimer(saved, {
        setInputMinutes,
        setSecondsLeft,
        setRunning,
        runningSecondsRef,
        loggedRef,
        runningSinceRef,
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onTick() {
      const saved = loadTimerState();
      if (!saved) return;
      applySavedTimer(saved, {
        setInputMinutes,
        setSecondsLeft,
        setRunning,
        runningSecondsRef,
        loggedRef,
        runningSinceRef,
      });
    }
    window.addEventListener(FOCUS_TIMER_TICK_EVENT, onTick);
    return () => window.removeEventListener(FOCUS_TIMER_TICK_EVENT, onTick);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist();
  }, [hydrated, persist]);

  useEffect(() => {
    return () => {
      persist();
    };
  }, [persist]);

  const finishSession = useCallback(async () => {
    setRunning(false);
    runningSinceRef.current = null;
    const minutes = Math.floor(runningSecondsRef.current / 60);
    if (minutes < 1) {
      setMessage("Run the timer at least 1 minute to log study time.");
      return;
    }
    if (loggedRef.current) return;
    const ok = await logStudySession(minutes);
    if (ok) {
      loggedRef.current = true;
      setMessage(`Logged ${minutes} min — shows on Today under Study hours.`);
      clearTimerState();
      onSessionLogged?.();
    } else {
      setMessage("Could not save. Run migration 20250535000000_study_sessions.sql in Supabase.");
    }
  }, [onSessionLogged]);

  useEffect(() => {
    if (!hydrated || !running || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
      runningSecondsRef.current += 1;
    }, 1000);
    return () => clearInterval(t);
  }, [hydrated, running, secondsLeft]);

  useEffect(() => {
    if (!hydrated) return;
    if (secondsLeft === 0 && runningSecondsRef.current >= 60 && !loggedRef.current) {
      void finishSession();
    }
  }, [hydrated, secondsLeft, finishSession]);

  function applyDuration() {
    const mins = Math.min(180, Math.max(1, Number(inputMinutes) || 1));
    setInputMinutes(mins);
    setSecondsLeft(mins * 60);
    setRunning(false);
    runningSinceRef.current = null;
    runningSecondsRef.current = 0;
    loggedRef.current = false;
    setMessage(null);
    clearTimerState();
  }

  function reset() {
    setRunning(false);
    runningSinceRef.current = null;
    const mins = Math.min(180, Math.max(1, Number(inputMinutes) || 1));
    setSecondsLeft(mins * 60);
    runningSecondsRef.current = 0;
    loggedRef.current = false;
    setMessage(null);
    clearTimerState();
  }

  function toggleRunning() {
    if (running) {
      setRunning(false);
      runningSinceRef.current = null;
    } else if (secondsLeft > 0 && !loggedRef.current) {
      setRunning(true);
      runningSinceRef.current = Date.now();
    }
  }

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading timer…</p>
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const done = secondsLeft === 0;
  const ranMin = Math.floor(runningSecondsRef.current / 60);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Timer</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Study time keeps counting on other app tabs; return here to see the live countdown. Only
        active time counts toward Study hours.
      </p>

      <p
        className={`mt-4 font-mono text-4xl font-semibold tracking-tight ${
          done ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {done ? "Done" : `${mm}:${ss}`}
      </p>

      {running ? (
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Tracking study time…</p>
      ) : ranMin > 0 ? (
        <p className="mt-1 text-xs text-zinc-500">{ranMin} min ran this session</p>
      ) : null}

      <label className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Minutes</span>
        <input
          type="number"
          min={1}
          max={180}
          className="w-20 rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={inputMinutes}
          onChange={(e) => setInputMinutes(Number(e.target.value))}
          disabled={running}
        />
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          onClick={applyDuration}
          disabled={running}
        >
          Set
        </button>
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={toggleRunning}
          disabled={done && loggedRef.current}
        >
          {running ? "Pause" : done && loggedRef.current ? "Logged" : "Start"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={reset}>
          Reset
        </Button>
        {ranMin >= 1 && !loggedRef.current ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => void finishSession()}>
            Log {ranMin} min
          </Button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
    </div>
  );
}
