"use client";

import { apiPaths } from "@k12/shared";
import { getDueLabel } from "@k12/shared";
import Link from "next/link";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

function badgeFor(dueAt) {
  const label = getDueLabel(dueAt);
  if (label === "overdue") return <Badge variant="overdue">Overdue</Badge>;
  if (label === "dueSoon") return <Badge variant="dueSoon">Due soon</Badge>;
  return null;
}

export function UpcomingDeadlines({ items, onMarkDone }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Upcoming deadlines</h2>
        <Link href="/app/assignments" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No upcoming deadlines. Nice work!</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-zinc-500">
                  {a.courses?.name ?? "Course"} · {new Date(a.due_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {badgeFor(a.due_at)}
                {a.status !== "done" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onMarkDone(a.id)}
                  >
                    Done
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
