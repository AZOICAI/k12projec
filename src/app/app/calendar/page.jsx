"use client";

import { apiPaths } from "@k12/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeekMonday(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);

  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const byDay = useMemo(() => {
    const map = {};
    for (const day of days) {
      const key = day.toDateString();
      map[key] = [];
    }
    for (const a of assignments) {
      const due = new Date(a.due_at);
      const key = new Date(due.getFullYear(), due.getMonth(), due.getDate()).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [assignments, days]);

  const load = useCallback(async () => {
    setError(null);
    const from = weekStart.toISOString();
    const to = weekEnd.toISOString();
    const q = new URLSearchParams({ from, to });
    const res = await fetch(`${apiPaths.assignments}?${q}`, { credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setAssignments(await res.json());
  }, [weekStart, weekEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Week view of what is due. Use arrows to move between weeks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart((ws) => addDays(ws, -7))}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
          >
            This week
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart((ws) => addDays(ws, 7))}
          >
            Next
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day, i) => {
          const key = day.toDateString();
          const items = byDay[key] ?? [];
          return (
            <div
              key={key}
              className="flex min-h-[180px] flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="text-xs font-semibold uppercase text-zinc-500">{WEEKDAYS[i]}</div>
              <div className="text-sm font-medium">{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              <ul className="mt-2 flex flex-1 flex-col gap-2 text-xs">
                {items.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div className="font-medium leading-snug">{a.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: a.courses?.color ?? "#3B82F6" }}
                      />
                      {new Date(a.due_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
