"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patchAssignment } from "@/lib/assignments/patchAssignment";
import { formatRelativeDue } from "@/lib/dates/formatDue";

/** Flat assignment list across classes for one filter (overdue / today / soon). */
export function FilteredWorkList({ items, emptyText, pushUndo }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const now = new Date();

  async function markDone(assignment) {
    setBusyId(assignment.id);
    const prev = assignment.status;
    const ok = await patchAssignment(assignment.id, { status: "done" });
    setBusyId(null);
    if (!ok) return;
    pushUndo?.({
      label: "mark done",
      run: async () => {
        await patchAssignment(assignment.id, { status: prev });
      },
    });
    router.refresh();
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {items.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: a.courses?.color ?? "#3B82F6" }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {a.title}
            </p>
            <p className="text-xs text-zinc-500">
              {a.courses?.name ?? "Class"} · {formatRelativeDue(a.due_at, now)}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-emerald-950"
            disabled={busyId === a.id}
            onClick={() => void markDone(a)}
          >
            {busyId === a.id ? "Saving…" : "Mark done"}
          </button>
        </li>
      ))}
    </ul>
  );
}
