"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";

const weeklyRoutineKey = "k12-weekly-routine";
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function buildEmptyRoutine() {
  return Object.fromEntries(dayNames.map((day) => [day, []]));
}

function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDuration(ms) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function StudyPage() {
  const [blocks, setBlocks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [routine, setRoutine] = useState(buildEmptyRoutine);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [savedRoutine, setSavedRoutine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [itemTitle, setItemTitle] = useState("");
  const [itemStartsLocal, setItemStartsLocal] = useState("09:00");
  const [itemEndsLocal, setItemEndsLocal] = useState("10:00");
  const [itemCourseId, setItemCourseId] = useState("");
  const [itemAssignmentId, setItemAssignmentId] = useState("");

  const [timerTitle, setTimerTitle] = useState("Focused study");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerCourseId, setTimerCourseId] = useState("");
  const [timerAssignmentId, setTimerAssignmentId] = useState("");
  const [timerStudyBlockId, setTimerStudyBlockId] = useState(null);
  const [timerStartAt, setTimerStartAt] = useState(null);
  const [timerEndAt, setTimerEndAt] = useState(null);
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
    setCourses(await cRes.json());
    setAssignments(await aRes.json());
    setLoading(false);
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(weeklyRoutineKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRoutine({ ...buildEmptyRoutine(), ...parsed });
        setSavedRoutine(parsed);
      }
    } catch {
      setSavedRoutine(null);
    }

    void load();
  }, []);

  function playAlarm() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) {
        const audioContext = new AudioCtor();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.08;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch {
      // no-op: browser may block audio until user interaction
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Study session complete");
    }
  }

  async function markStudyBlockComplete(blockId) {
    if (!blockId) return;

    const res = await fetch(apiPaths.studyBlock(blockId), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_complete: true,
        completed_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    await load();
  }

  useEffect(() => {
    if (!timerStartAt || !timerEndAt) return;

    const intervalId = window.setInterval(() => {
      const now = Date.now();

      if (now < timerStartAt) {
        setTimerRunning(false);
        setTimerRemainingMs(Math.max(0, timerStartAt - now));
        return;
      }

      const remaining = Math.max(0, timerEndAt - now);
      setTimerRunning(remaining > 0);
      setTimerRemainingMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        setTimerRunning(false);
        setTimerStartAt(null);
        setTimerEndAt(null);
        setTimerRemainingMs(0);
        const completedBlockId = timerStudyBlockId;
        setTimerStudyBlockId(null);
        playAlarm();
        if (completedBlockId) {
          void markStudyBlockComplete(completedBlockId);
        }
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerStartAt, timerEndAt, timerStudyBlockId]);

  function saveRoutine() {
    const normalized = { ...buildEmptyRoutine() };
    for (const day of dayNames) {
      normalized[day] = (routine[day] ?? []).filter(Boolean);
    }
    setSavedRoutine(normalized);
    window.localStorage.setItem(weeklyRoutineKey, JSON.stringify(normalized));
  }

  async function createStudyBlockFromTimer({ title, startsAt, endsAt, courseId, assignmentId }) {
    const payload = {
      title: title.trim() || "Focused study",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      course_id: courseId || null,
      assignment_id: assignmentId || null,
    };

    const res = await fetch(apiPaths.studyBlocks, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError(await res.text());
      return null;
    }

    const created = await res.json();
    const startMs = new Date(created.starts_at).getTime();
    const endMs = new Date(created.ends_at).getTime();
    const now = Date.now();
    const isInProgress = now >= startMs && now < endMs;

    setTimerTitle(created.title || payload.title);
    setTimerCourseId(created.course_id || "");
    setTimerAssignmentId(created.assignment_id || "");
    setTimerStudyBlockId(created.id);
    setTimerStartAt(startMs);
    setTimerEndAt(endMs);
    setTimerRemainingMs(isInProgress ? Math.max(0, endMs - now) : Math.max(0, startMs - now));
    setTimerRunning(isInProgress);

    await load();
    return created;
  }

  async function addRoutineItem(e) {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const nextItem = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title: itemTitle.trim(),
      startsLocal: itemStartsLocal,
      endsLocal: itemEndsLocal,
      courseId: itemCourseId || null,
      assignmentId: itemAssignmentId || null,
    };

    setRoutine((current) => ({
      ...current,
      [selectedDay]: [...(current[selectedDay] ?? []), nextItem],
    }));

    const weekStart = getWeekStart();
    const dayIndex = dayNames.indexOf(selectedDay);
    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() + dayIndex);

    const [startHour, startMinute] = itemStartsLocal.split(":").map(Number);
    const [endHour, endMinute] = itemEndsLocal.split(":").map(Number);

    const resolvedStart = new Date(startDate);
    resolvedStart.setHours(startHour, startMinute, 0, 0);

    const resolvedEnd = new Date(startDate);
    resolvedEnd.setHours(endHour, endMinute, 0, 0);

    if (!Number.isNaN(resolvedStart.getTime()) && !Number.isNaN(resolvedEnd.getTime()) && resolvedEnd > resolvedStart) {
      const now = Date.now();
      setTimerTitle(nextItem.title);
      setTimerCourseId(nextItem.courseId || "");
      setTimerAssignmentId(nextItem.assignmentId || "");
      setTimerStudyBlockId(null);
      setTimerStartAt(resolvedStart.getTime());
      setTimerEndAt(resolvedEnd.getTime());
      setTimerRemainingMs(now < resolvedStart.getTime() ? resolvedStart.getTime() - now : Math.max(0, resolvedEnd.getTime() - now));
      setTimerRunning(now >= resolvedStart.getTime() && now < resolvedEnd.getTime());
      await createStudyBlockFromTimer({
        title: nextItem.title,
        startsAt: resolvedStart,
        endsAt: resolvedEnd,
        courseId: nextItem.courseId,
        assignmentId: nextItem.assignmentId,
      });
    }

    setItemTitle("");
    setItemStartsLocal("09:00");
    setItemEndsLocal("10:00");
    setItemCourseId("");
    setItemAssignmentId("");
  }

  async function completeTimer() {
    if (!timerStudyBlockId && (!timerStartAt || !timerEndAt)) return;

    if (timerStudyBlockId) {
      const res = await fetch(apiPaths.studyBlock(timerStudyBlockId), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_complete: true,
          completed_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }
    } else {
      const start = new Date(timerStartAt);
      const end = new Date(timerEndAt);

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
          is_complete: true,
          completed_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }
    }

    setTimerStudyBlockId(null);
    setTimerStartAt(null);
    setTimerEndAt(null);
    setTimerRemainingMs(25 * 60 * 1000);
    setTimerRunning(false);
    setTimerCourseId("");
    setTimerAssignmentId("");
    playAlarm();
    await load();
  }

  async function applyRoutine() {
    const weekStart = getWeekStart();
    const blocksToCreate = [];

    for (const day of dayNames) {
      const entries = routine[day] ?? [];
      for (const entry of entries) {
        if (!entry.title || !entry.startsLocal || !entry.endsLocal) continue;

        const dayIndex = dayNames.indexOf(day);
        const startDate = new Date(weekStart);
        startDate.setDate(startDate.getDate() + dayIndex);

        const [startHour, startMinute] = entry.startsLocal.split(":").map(Number);
        const [endHour, endMinute] = entry.endsLocal.split(":").map(Number);

        const startsAt = new Date(startDate);
        startsAt.setHours(startHour, startMinute, 0, 0);

        const endsAt = new Date(startDate);
        endsAt.setHours(endHour, endMinute, 0, 0);

        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
          setError(`Check the time for ${day}: ${entry.title}`);
          return;
        }

        blocksToCreate.push({
          title: entry.title,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          course_id: entry.courseId || null,
          assignment_id: entry.assignmentId || null,
        });
      }
    }

    if (!blocksToCreate.length) {
      setError("Add at least one item to your weekly routine before applying it.");
      return;
    }

    const results = await Promise.all(
      blocksToCreate.map((block) =>
        fetch(apiPaths.studyBlocks, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(block),
        }),
      ),
    );

    if (results.some((res) => !res.ok)) {
      const issue = await Promise.all(results.filter((res) => !res.ok).map((res) => res.text()));
      setError(issue.join(", "));
      return;
    }

    await load();
  }

  function startTimer() {
    const safeTitle = timerTitle.trim() || "Focused study";
    const durationMs = Math.max(5, Number(timerMinutes) || 25) * 60 * 1000;
    const start = Date.now();
    const end = start + durationMs;

    setTimerTitle(safeTitle);
    setTimerStartAt(start);
    setTimerEndAt(end);
    setTimerRemainingMs(durationMs);
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
    setTimerStartAt(null);
    setTimerEndAt(null);
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

  const formattedRemaining = formatDuration(timerRemainingMs);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Study planner</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Plan your week by day, save the routine, and apply it whenever you want a fresh study schedule.
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
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setTimerMinutes(Number.isFinite(next) && next > 0 ? next : 25);
                  }}
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
              Build your Monday–Sunday study flow, save it, and apply it each week.
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
            <span>Saved routine ready to apply</span>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dayNames.map((day) => (
          <div key={day} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`mb-3 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                selectedDay === day
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {day}
            </button>

            <ul className="space-y-2">
              {(routine[day] ?? []).map((entry) => (
                <li key={entry.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{entry.title}</div>
                  <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {entry.startsLocal}–{entry.endsLocal}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <form
        onSubmit={addRoutineItem}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Add study block for {selectedDay}</h2>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Starts</span>
            <input
              type="time"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={itemStartsLocal}
              onChange={(e) => setItemStartsLocal(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ends</span>
            <input
              type="time"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={itemEndsLocal}
              onChange={(e) => setItemEndsLocal(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Course (optional)</span>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={itemCourseId}
              onChange={(e) => setItemCourseId(e.target.value)}
            >
              <option value="">—</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Assignment (optional)</span>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={itemAssignmentId}
              onChange={(e) => setItemAssignmentId(e.target.value)}
            >
              <option value="">—</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add to {selectedDay}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No study blocks yet for the next three weeks.</p>
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
