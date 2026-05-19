"use client";

import { apiPaths } from "@k12/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { buildWeekCalendarData } from "@/lib/calendar/weekEvents";

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

function EventChip({ ev, border }) {
  return (
    <li className={`rounded-md border bg-zinc-50 p-2 dark:bg-zinc-900/60 ${border}`}>
      <div className="font-medium leading-snug">{ev.title}</div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
        {ev.time}
      </div>
    </li>
  );
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const weekDays = useMemo(
    () => buildWeekCalendarData(assignments, studyBlocks, courses, weekStart),
    [assignments, studyBlocks, courses, weekStart],
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const from = weekStart.toISOString();
    const to = weekEnd.toISOString();
    const q = new URLSearchParams({ from, to });
    const [aRes, sRes, cRes] = await Promise.all([
      fetch(`${apiPaths.assignments}?${q}`, { credentials: "include" }),
      fetch(`${apiPaths.studyBlocks}?${q}`, { credentials: "include" }),
      fetch(apiPaths.courses, { credentials: "include" }),
    ]);
    setLoading(false);
    if (!aRes.ok || !sRes.ok || !cRes.ok) {
      setError("Failed to load calendar.");
      return;
    }
    setAssignments(await aRes.json());
    setStudyBlocks(await sRes.json());
    setCourses(await cRes.json());
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
            Assignments, class times, and study blocks in one week view.
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

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Due
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> Study
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Class
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <ListSkeleton rows={7} />
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map(({ day, key, assignments: a, study, meetings }, i) => (
            <div
              key={key}
              className="flex min-h-[200px] flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="text-xs font-semibold uppercase text-zinc-500">{WEEKDAYS[i]}</div>
              <div className="text-sm font-medium">
                {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              <ul className="mt-2 flex flex-1 flex-col gap-2 text-xs">
                {meetings.map((ev) => (
                  <EventChip key={`m-${ev.id}`} ev={ev} border="border-emerald-200 dark:border-emerald-900" />
                ))}
                {study.map((ev) => (
                  <EventChip key={`s-${ev.id}`} ev={ev} border="border-violet-200 dark:border-violet-900" />
                ))}
                {a.map((ev) => (
                  <EventChip key={`a-${ev.id}`} ev={ev} border="border-blue-200 dark:border-blue-900" />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

