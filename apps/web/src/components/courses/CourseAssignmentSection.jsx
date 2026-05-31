"use client";

import { formatRelativeDue } from "@/lib/dates/formatDue";

export function CourseAssignmentSection({
  title,
  items,
  emptyText,
  onMarkDone,
  markingId = null,
}) {
  const now = new Date();
  if (!items?.length) {
    return (
      <div className="mt-2">
        <p className="text-[10px] font-semibold uppercase text-zinc-500">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold uppercase text-zinc-500">
        {title} ({items.length})
      </p>
      <ul className="mt-1 space-y-1">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-700 dark:text-zinc-300"
          >
            <span className="min-w-0">
              <span className="font-medium">{a.title}</span>
              <span className="text-zinc-500"> · {formatRelativeDue(a.due_at, now)}</span>
            </span>
            {onMarkDone && a.status !== "done" ? (
              <button
                type="button"
                className="shrink-0 text-[10px] font-medium text-blue-600 hover:underline disabled:opacity-50"
                disabled={markingId === a.id}
                onClick={() => onMarkDone(a)}
              >
                {markingId === a.id ? "Saving…" : "Mark done"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
