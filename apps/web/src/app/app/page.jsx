import Link from "next/link";
import { apiPaths } from "@k12/shared";
import { serverApi } from "@/lib/server-api";
import { filterRecentAssignments, getDatxGraduationProgress } from "@/lib/progress";

function weekBounds() {
  const now = new Date();
  const dow = now.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: sunday.toISOString() };
}

function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHours(hours) {
  return Number.isInteger(hours) ? `${hours}.0h` : `${hours.toFixed(1)}h`;
}

function getStudyHours(studyBlocks = []) {
  return studyBlocks.reduce((total, block) => {
    const startsAt = new Date(block.starts_at).getTime();
    const endsAt = new Date(block.ends_at).getTime();
    const durationHours = (endsAt - startsAt) / (1000 * 60 * 60);
    return total + Math.max(0, durationHours);
  }, 0);
}

export default async function DashboardPage() {
  const { from, to } = weekBounds();
  const q = new URLSearchParams({ from, to });
  let assignments = [];
  let studyBlocks = [];
  let loadError = null;

  try {
    const [a, s] = await Promise.all([
      serverApi(`${apiPaths.assignments}?${q.toString()}`),
      serverApi(`${apiPaths.studyBlocks}?${q.toString()}`),
    ]);
    assignments = a ?? [];
    studyBlocks = s ?? [];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard.";
  }

  const relevantAssignments = filterRecentAssignments(assignments);
  const now = Date.now();
  const totalThisWeek = relevantAssignments.length;
  const doneThisWeek = relevantAssignments.filter((row) => row.status === "done").length;
  const dueToday = relevantAssignments.filter((row) => row.status !== "done" && row.due_at && isSameDay(row.due_at, new Date())).length;
  const overdue = relevantAssignments.filter((row) => row.status !== "done" && row.due_at && new Date(row.due_at).getTime() < now).length;
  const dueSoon = relevantAssignments.filter((row) => {
    if (row.status === "done" || !row.due_at) return false;
    const dueAt = new Date(row.due_at).getTime();
    if (dueAt < now) return false;
    const hoursUntil = (dueAt - now) / (1000 * 60 * 60);
    return hoursUntil <= 48 && hoursUntil > 0 && !isSameDay(row.due_at, new Date());
  }).length;
  const needsRedo = relevantAssignments.filter((row) => ["redo", "low_grade"].includes(row.status)).length;
  const studyHours = getStudyHours(studyBlocks);
  const graduation = getDatxGraduationProgress();
  const completionRatio = totalThisWeek ? (doneThisWeek / totalThisWeek) * 100 : 0;

  const thisWeekAssignments = [...relevantAssignments]
    .filter((row) => row.due_at)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 6);

  const statCards = [
    { label: "Overdue", value: overdue, tone: "bg-[#2b0f15] border-[#c7434d] text-[#f0a2a7]" },
    { label: "Due today", value: dueToday, tone: "bg-[#2f1c12] border-[#d97136] text-[#f0b87c]" },
    { label: "Soon", value: dueSoon, tone: "bg-[#1f2142] border-[#4d6fe9] text-[#9bb3ff]" },
    { label: "Needs redo", value: needsRedo, tone: "bg-[#2a1a34] border-[#8a5ae6] text-[#d2b3ff]" },
    { label: "Study hours", value: formatHours(studyHours), tone: "bg-[#112d2a] border-[#25a66e] text-[#a5f0ce]" },
  ];

  return (
    <div className="flex flex-col gap-6 text-zinc-50">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Today</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your week at a glance — open Courses for each class, GPA, and redos.
          </p>
        </div>

        <Link
          href="/app/assignments"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
        >
          <span className="text-lg">＋</span>
          Quick add
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-4 shadow-sm ${card.tone}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-200/85">
              {card.label}
            </div>
            <div className="mt-5 text-4xl font-bold leading-none">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">This week</h2>
          <span className="text-sm text-zinc-400">
            {doneThisWeek} of {totalThisWeek || 0} done
          </span>
        </div>

        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-zinc-500 via-zinc-300 to-white"
            style={{ width: `${Math.min(100, completionRatio)}%` }}
          />
        </div>

        <p className="mt-5 text-sm text-zinc-400">
          Class breakdown and redos live in Courses. Ctrl+Z to undo.
        </p>
      </section>

      <section className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-bold">Due this week</h3>
        </div>

        {thisWeekAssignments.length === 0 ? (
          <div className="mt-5 text-center text-sm text-zinc-400">Nothing due this week — you’re clear.</div>
        ) : (
          <ul className="mt-5 space-y-3">
            {thisWeekAssignments.map((row) => {
              const dueAt = new Date(row.due_at);
              const isPast = dueAt.getTime() < now && row.status !== "done";
              const label = isPast ? "Overdue" : dueAt.getTime() <= now + 1000 * 60 * 60 * 48 ? "Due soon" : null;

              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-100">{row.title}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {row.courses?.name ?? "Course"} · {dueAt.toLocaleDateString([], { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {label ? (
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isPast ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>
                        {label}
                      </span>
                    ) : null}
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.courses?.color ?? "#60a5fa" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">Graduation progress</h3>
          <span className="text-sm text-zinc-400">{Math.round(graduation.percent)}%</span>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${Math.min(100, graduation.percent)}%` }}
          />
        </div>

        <div className="mt-3 text-sm text-zinc-400">
          {graduation.totalCompleted} of {graduation.totalRequired} credits completed
        </div>
      </section>

      {loadError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
