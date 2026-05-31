"use client";

import { apiPaths, isSameLocalDate, toLocalDateInputValue } from "@k12/shared";
import { useMemo, useState } from "react";
import { buildStudyBlockPayload } from "@/lib/study/routineBuilder";
import { Button } from "@/components/ui/Button";

function blocksOnDate(blocks, dateStr) {
  return blocks
    .filter((b) => isSameLocalDate(b.starts_at, dateStr))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

function toLocalMinDate() {
  return toLocalDateInputValue(new Date());
}

function formatBlockTime(block) {
  const start = new Date(block.starts_at);
  const end = new Date(block.ends_at);
  const opts = { hour: "numeric", minute: "2-digit" };
  return `${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, opts)}`;
}

export function SchedulePlanPanel({ planDate, onPlanDateChange, studyBlocks, onReload }) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const dayBlocks = useMemo(() => blocksOnDate(studyBlocks, planDate), [studyBlocks, planDate]);

  async function addToSchedule(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const payload = buildStudyBlockPayload({
      title,
      startTime,
      durationMinutes,
      planDate,
    });
    if (!payload) {
      setError("Add a title, start time, and duration (at least 5 minutes).");
      return;
    }

    setBusy(true);
    const res = await fetch(apiPaths.studyBlocks, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);

    if (!res.ok) {
      setError("Could not add — try again.");
      return;
    }

    setTitle("");
    setMessage(`Added "${payload.title}" to ${planDate}.`);
    await onReload();
  }

  async function deleteBlock(id) {
    setError(null);
    setMessage(null);
    setDeletingId(id);
    const res = await fetch(apiPaths.studyBlock(id), {
      method: "DELETE",
      credentials: "include",
    });
    setDeletingId(null);

    if (!res.ok) {
      setError("Could not delete — try again.");
      return;
    }

    await onReload();
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => void addToSchedule(e)}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pick a day, what you&apos;re doing, start time, and how long it lasts.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Day</span>
          <input
            type="date"
            className="max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={planDate}
            min={toLocalMinDate()}
            onChange={(e) => onPlanDateChange(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">What you&apos;re doing</span>
          <input
            type="text"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Math homework, lunch, study group…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Start time</span>
            <input
              type="time"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Duration</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                className="w-24 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
              <span className="text-zinc-500">minutes</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`rounded-md px-2 py-0.5 text-xs ${
                    durationMinutes === m
                      ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                  onClick={() => setDurationMinutes(m)}
                >
                  {m}m
                </button>
              ))}
            </div>
          </label>
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? "Adding…" : "Add to schedule"}
        </Button>

        {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {dayBlocks.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            On {planDate} ({dayBlocks.length})
          </p>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {dayBlocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-zinc-500">{formatBlockTime(b)}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
                  disabled={deletingId === b.id}
                  onClick={() => void deleteBlock(b.id)}
                >
                  {deletingId === b.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Nothing planned for this day yet.</p>
      )}
    </div>
  );
}
