"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const priorityLabels = {
  0: "Overdue",
  1: "Due today",
  2: "Due soon",
  3: "In progress",
  4: "Upcoming",
};

export function WorkNowCard({ items, onMarkDone }) {
  if (!items?.length) {
    return (
      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">What to work on now</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Nothing urgent — you are caught up or have not added assignments yet.
        </p>
        <Link href="/app/assignments" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Add assignments
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">What to work on now</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {priorityLabels[item.priority] ?? "Upcoming"}
              </p>
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
              <p className="text-xs text-zinc-500">
                {item.courses?.name ?? "Course"} · due {new Date(item.due_at).toLocaleString()}
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => onMarkDone(item.id)}>
              Done
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
