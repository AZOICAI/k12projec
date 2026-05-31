"use client";

import { isDueToday } from "@k12/shared";
import { formatGradeLabel } from "@/lib/assignments/grades";
import { formatRelativeDue } from "@/lib/dates/formatDue";

function rowLabel(assignment, now) {
  if (isDueToday(assignment.due_at, now)) return "Due today";
  return null;
}

export function DashboardWeekList({ items, onStatusChange }) {
  const now = new Date();

  if (!items?.length) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Nothing due this week — you&apos;re clear.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {items.map((a) => {
        const label = rowLabel(a, now);
        const showGrade = a.grade_percent != null && a.status === "done";
        return (
          <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.courses?.color ?? "#3B82F6" }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{a.title}</p>
                {a.is_redo ? (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                    Redo
                  </span>
                ) : null}
                {showGrade ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {formatGradeLabel(a)}
                  </span>
                ) : null}
                {label ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    {label}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-zinc-500">
                {a.courses?.name ?? "Course"} · {formatRelativeDue(a.due_at, now)}
              </p>
            </div>
            <select
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              value={a.status}
              onChange={(e) => onStatusChange(a.id, e.target.value, a.status)}
              aria-label="Status"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </li>
        );
      })}
    </ul>
  );
}
