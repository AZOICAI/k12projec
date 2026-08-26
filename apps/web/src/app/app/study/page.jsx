"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";

const weeklyRoutineKey = "k12-weekly-routine";

export default function StudyPage() {
  const [blocks, setBlocks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [courseId, setCourseId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [savedRoutine, setSavedRoutine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timerTitle, setTimerTitle] = useState("Focused study");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerCourseId, setTimerCourseId] = useState("");
  const [timerAssignmentId, setTimerAssignmentId] = useState("");
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerDurationMs, setTimerDurationMs] = useState(25 * 60 * 1000);
  const [timerRemainingMs, setTimerRemainingMs] = useState(25 * 60 * 1000);
  const [timerRunning, setTimerRunning] = useState(false);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [blocks],
  );

  async function load() {
    setError(null);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 21);
    to.setHours(23, 59, 59, 999);
    const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const [bRes, cRes, aRes] = await Promise.all([
      fetch(`${apiPaths.studyBlocks}?${q}`, { credentials: "include" }),
      fetch(apiPaths.courses, { credentials: "include" }),
      fetch(apiPaths.assignments, { credentials: "include" }),
    ]);
    if (!bRes.ok || !cRes.ok || !aRes.ok) {
      const t = await (bRes.ok ? cRes : bRes).text();
      setError(t);
      setLoading(false);
      return;
    }
    setBlocks(await bRes.json());
    const cJson = await cRes.json();
    setCourses(cJson);
    setAssignments(await aRes.json());
    setLoading(false);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(weeklyRoutineKey);
    if (saved) {
      try {
        setSavedRoutine(JSON.parse(saved));
      } catch {
        setSavedRoutine(null);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (!timerRunning || !timerStartedAt) return;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, timerDurationMs - (now - timerStartedAt));
      setTimerRemainingMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        setTimerRunning(false);
        void completeTimer();
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning, timerStartedAt, timerDurationMs]);

  function saveRoutine() {
    if (!title || !startsLocal || !endsLocal) return;

    const routine = { title, startsLocal, endsLocal, courseId, assignmentId };
    setSavedRoutine(routine);
    window.localStorage.setItem(weeklyRoutineKey, JSON.stringify(routine));
  }

  async function completeTimer() {
    if (!timerStartedAt) return;

    const start = new Date(timerStartedAt);
    const end = new Date();

    const res = await fetch(apiPaths.studyBlocks, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: timerTitle.trim() || "Focused study",
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        course_id: timerCourseId || null,
        assignment_id: timerAssignmentId || null,
      }),
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    setTimerStartedAt(null);
    setTimerDurationMs(25 * 60 * 1000);
    setTimerRemainingMs(25 * 60 * 1000);
    setTimerRunning(false);
    setTimerCourseId("");
    setTimerAssignmentId("");
    await load();
  }

  async function applyRoutine() {
    if (!savedRoutine) return;

    const anchor = new Date();
    const today = anchor.getDay();
    const mondayOffset = today === 0 ? -6 : 1 - today;
    const startDate = new Date(anchor);
    startDate.setDate(anchor.getDate() + mondayOffset);
    startDate.setHours(0, 0, 0, 0);

    const [startHour, startMinute] = savedRoutine.startsLocal.split(":").map(Number);
    const [endHour, endMinute] = savedRoutine.endsLocal.split(":").map(Number);

    const nextBlocks = Array.from({ length: 5 }, (_, idx) => {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + idx);
      current.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(current);
      endDate.setHours(endHour, endMinute, 0, 0);

      return {
        title: savedRoutine.title,
        starts_at: current.toISOString(),
        ends_at: endDate.toISOString(),
        course_id: savedRoutine.courseId || null,
        assignment_id: savedRoutine.assignmentId || null,
      };
    });

    const results = await Promise.all(
      nextBlocks.map((block) =>
        fetch(apiPaths.studyBlocks, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(block),
        }),
      ),
    );

    if (results.some((res) => !res.ok)) {
      const errorText = await Promise.all(results.filter((res) => !res.ok).map((res) => res.text()));
      setError(errorText.join(", "));
      return;
    }

    await load();
  }

  async function addBlock(e) {
    e.preventDefault();
    setError(null);
    const res = await fetch(apiPaths.studyBlocks, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        starts_at: new Date(startsLocal).toISOString(),
        ends_at: new Date(endsLocal).toISOString(),
        course_id: courseId || null,
        assignment_id: assignmentId || null,
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setTitle("");
    setCourseId("");
    setAssignmentId("");
    await load();
  }

  function startTimer() {
    const safeTitle = timerTitle.trim() || "Focused study";
    const start = Date.now();
    const durationMs = Math.max(1, Number(timerMinutes || 25)) * 60 * 1000;
    setTimerTitle(safeTitle);
    setTimerStartedAt(start);
    setTimerDurationMs(durationMs);
    setTimerRemainingMs(durationMs);
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
    setTimerDurationMs(Math.max(1, timerRemainingMs));
  }

  async function remove(id) {
    setError(null);
    const res = await fetch(apiPaths.studyBlock(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  const formattedRemaining = new Date(timerRemainingMs).toISOString().slice(14, 19);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Study planner</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Block out focused study time. Optionally link a course or assignment.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Session title</span>
              <input
                value={timerTitle}
                onChange={(e) => setTimerTitle(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Minutes</span>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value || 25))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Course</span>
                <select
                  value={timerCourseId}
                  onChange={(e) => setTimerCourseId(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">None</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Assignment</span>
                <select
                  value={timerAssignmentId}
                  onChange={(e) => setTimerAssignmentId(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">None</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-4xl font-bold tracking-tight">{formattedRemaining}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Focus timer</div>
            <div className="flex gap-2">
              {!timerRunning ? (
                <button type="button" onClick={startTimer} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Start
                </button>
              ) : (
                <button type="button" onClick={pauseTimer} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  Pause
                </button>
              )}
              <button type="button" onClick={() => void completeTimer()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                Complete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weekly routine</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Save a routine and apply it to each school week.
            </p>
          </div>
          <button
            type="button"
            onClick={saveRoutine}
            className="w-fit rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Save routine
          </button>
        </div>

        {savedRoutine ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
            <span>
              Saved: {savedRoutine.title} · {savedRoutine.startsLocal}–{savedRoutine.endsLocal}
            </span>
            <button
              type="button"
              onClick={() => void applyRoutine()}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Apply this week
            </button>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={addBlock}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Starts</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={startsLocal}
              onChange={(e) => setStartsLocal(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ends</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={endsLocal}
              onChange={(e) => setEndsLocal(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Course (optional)</span>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">—</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}
                  >{c.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Assignment (optional)</span>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
            >
              <option value="">—</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add study block
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No study blocks in the next three weeks.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {sorted.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="font-medium">{b.title}</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {new Date(b.starts_at).toLocaleString()} – {new Date(b.ends_at).toLocaleString()}
                </div>
              </div>
              <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void remove(b.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
