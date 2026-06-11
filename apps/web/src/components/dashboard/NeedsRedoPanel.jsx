"use client";

import { apiPaths } from "@k12/shared";
import { useState } from "react";
import { createRedoForAssignment } from "@/lib/assignments/createRedo";
import { formatGradeLabel, getLowGradeThreshold } from "@/lib/assignments/grades";
import { patchAssignment } from "@/lib/assignments/patchAssignment";
import { formatRelativeDue } from "@/lib/dates/formatDue";

export function NeedsRedoPanel({ items, onRefresh, pushUndo }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const now = new Date();

  async function scheduleRedo(assignment) {
    setError(null);
    setBusyId(assignment.id);
    const result = await createRedoForAssignment(assignment);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error ?? "Could not create redo.");
      return;
    }
    if (result.data?.id) {
      pushUndo?.({
        label: "schedule redo",
        run: async () => {
          await fetch(apiPaths.assignment(result.data.id), {
            method: "DELETE",
            credentials: "include",
          });
        },
      });
    }
    onRefresh();
  }

  async function dismiss(assignment) {
    setError(null);
    const ok = await patchAssignment(assignment.id, { redo_dismissed: true });
    if (!ok) {
      setError("Could not dismiss.");
      return;
    }
    pushUndo?.({
      label: "dismiss redo",
      run: async () => {
        await patchAssignment(assignment.id, { redo_dismissed: false });
      },
    });
    onRefresh();
  }

  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        <p>No low grades detected yet.</p>
        <p className="mt-2 text-xs">Scores sync automatically from Canvas — nothing to fix here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-zinc-100 rounded-xl border border-violet-200/80 bg-violet-50/20 dark:divide-zinc-800 dark:border-violet-900/50 dark:bg-violet-950/15">
        {items.map((a) => {
          const threshold = a.low_grade_threshold ?? getLowGradeThreshold(null);
          return (
            <li key={a.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full sm:mt-0"
                style={{ backgroundColor: a.courses?.color ?? "#3B82F6" }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{a.title}</p>
                <p className="text-xs text-zinc-500">
                  {a.courses?.name ?? "Class"} · scored {formatGradeLabel(a)} (below {threshold}%)
                  {a.status === "done" ? " · Turned in" : ""} · {formatRelativeDue(a.due_at, now)}
                </p>
                {a.redo_impact_percent != null && a.course_grade_percent != null ? (
                  <p className="mt-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                    Redo for full credit: class grade {a.course_grade_percent}% → est.{" "}
                    {a.redo_impact_percent}%
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === a.id}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  onClick={() => void scheduleRedo(a)}
                >
                  {busyId === a.id ? "Adding…" : "Schedule redo"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  onClick={() => void dismiss(a)}
                >
                  Dismiss
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
