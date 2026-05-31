"use client";

import { apiPaths, toLocalDateInputValue } from "@k12/shared";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDayColumn } from "@/components/calendar/CalendarDayColumn";
import { SchedulePlanPanel } from "@/components/schedule/SchedulePlanPanel";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { buildWeekAgenda, buildWeekCalendarData } from "@/lib/calendar/weekEvents";

/** First column of the grid = today (no past days in the current view). */
function startOfToday(d = new Date()) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function todayDateInput() {
  return toLocalDateInputValue(new Date());
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfToday());
  const [planDate, setPlanDate] = useState(todayDateInput);
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const weekDays = useMemo(
    () => buildWeekCalendarData(assignments, studyBlocks, weekStart),
    [assignments, studyBlocks, weekStart],
  );

  const weekAgenda = useMemo(() => buildWeekAgenda(weekDays), [weekDays]);

  const weekRangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    const opts = { month: "short", day: "numeric" };
    const startOpts =
      weekStart.getFullYear() !== end.getFullYear()
        ? { year: "numeric", month: "short", day: "numeric" }
        : opts;
    return `${weekStart.toLocaleDateString(undefined, startOpts)} – ${end.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
  }, [weekStart]);

  const todayKey = new Date().toDateString();

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const from = weekStart.toISOString();
    const to = weekEnd.toISOString();
    const q = new URLSearchParams({ from, to });
    const [aRes, sRes] = await Promise.all([
      fetch(`${apiPaths.assignments}?${q}`, { credentials: "include" }),
      fetch(`${apiPaths.studyBlocks}?${q}`, { credentials: "include" }),
    ]);
    setLoading(false);
    if (!aRes.ok || !sRes.ok) {
      setError("Failed to load schedule.");
      return;
    }
    setAssignments(await aRes.json());
    setStudyBlocks(await sRes.json());
  }, [weekStart, weekEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  function goToTodayWeek() {
    setWeekStart(startOfWeekMonday(new Date()));
    setPlanDate(todayDateInput());
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Schedule" description={weekRangeLabel}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart((ws) => addDays(ws, -7))}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            onClick={goToTodayWeek}
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart((ws) => addDays(ws, 7))}
          >
            →
          </button>
        </div>
      </PageHeader>

      <p className="text-sm text-zinc-500">
        Next 7 days from the first column (today). Add blocks below — they show on the grid.{" "}
        <Link href="/app/study" className="text-blue-600 hover:underline">
          Start focus timer →
        </Link>
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <ListSkeleton rows={7} />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7 md:gap-3">
          {weekDays.map(({ day, key, assignments: a, study }) => (
            <CalendarDayColumn
              key={key}
              day={day}
              isToday={key === todayKey}
              study={study}
              assignments={a}
            />
          ))}
        </div>
      )}

      {!loading ? (
        <CollapsibleSection title="Plan my day" summary="Title, start time, duration" defaultOpen>
          <SchedulePlanPanel
            planDate={planDate}
            onPlanDateChange={setPlanDate}
            studyBlocks={studyBlocks}
            onReload={load}
          />
        </CollapsibleSection>
      ) : null}

      {!loading && weekAgenda.length > 0 ? (
        <CollapsibleSection title="Agenda list" summary={`${weekAgenda.length} events`} defaultOpen={false}>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {weekAgenda.map((ev) => (
              <li key={`${ev.kind}-${ev.id}-${ev.dayKey}`} className="flex gap-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-xs text-zinc-500">{ev.dayLabel}</span>
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ev.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-xs text-zinc-500">
                    {ev.kind} · {ev.time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
