"use client";

import Link from "next/link";

const KIND_RANK = { overdue: 0, today: 1, redo: 2 };

function pointsOf(a) {
  const p = Number(a.points_possible);
  return Number.isFinite(p) ? p : 0;
}

/** Top picks ordered by grade damage: big overdue points, then today, then redos. */
export function buildDayPicks(courses, limit = 3) {
  const picks = [];
  const seen = new Set();

  const add = (a, course, kind, reason) => {
    if (seen.has(a.id)) return;
    seen.add(a.id);
    picks.push({ assignment: a, courseName: course.name, kind, reason });
  };

  for (const c of courses ?? []) {
    for (const a of c.overdue ?? []) {
      add(a, c, "overdue", pointsOf(a) > 0 ? `Overdue · worth ${pointsOf(a)} pts` : "Overdue");
    }
    for (const a of c.due_today ?? []) {
      add(a, c, "today", "Due today");
    }
    for (const a of c.needs_redo ?? []) {
      const impact =
        a.redo_impact_percent != null && a.course_grade_percent != null
          ? ` — redo could take ${c.name} to est. ${a.redo_impact_percent}%`
          : "";
      add(a, c, "redo", `Scored ${a.grade_percent != null ? `${a.grade_percent}%` : "low"}${impact}`);
    }
  }

  picks.sort((x, y) => {
    const r = KIND_RANK[x.kind] - KIND_RANK[y.kind];
    if (r !== 0) return r;
    if (x.kind === "redo") {
      return (y.assignment.redo_impact_percent ?? 0) - (x.assignment.redo_impact_percent ?? 0);
    }
    const p = pointsOf(y.assignment) - pointsOf(x.assignment);
    if (p !== 0) return p;
    return new Date(x.assignment.due_at).getTime() - new Date(y.assignment.due_at).getTime();
  });

  return picks.slice(0, limit);
}

const KIND_STYLES = {
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  today: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  redo: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
};

const KIND_LABELS = { overdue: "Overdue", today: "Today", redo: "Redo" };

export function StartMyDay({ courses, onMarkDone }) {
  const picks = buildDayPicks(courses);

  if (!picks.length) return null;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-blue-950 dark:text-blue-100">Start here</h2>
        <p className="text-xs text-blue-900/70 dark:text-blue-200/70">
          Biggest grade impact first
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {picks.map(({ assignment: a, courseName, kind, reason }) => (
          <li
            key={a.id}
            className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2.5 sm:flex-row sm:items-center dark:border-blue-900/60 dark:bg-zinc-950"
          >
            <span
              className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${KIND_STYLES[kind]}`}
            >
              {KIND_LABELS[kind]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {courseName ? `${courseName}: ` : ""}
                {a.title}
              </p>
              <p className="text-xs text-zinc-500">{reason}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/app/study?assignment=${a.id}`}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Focus on this
              </Link>
              {kind !== "redo" ? (
                <button
                  type="button"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  onClick={() => onMarkDone?.(a)}
                >
                  Done
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
