import Link from "next/link";
import { formatStudyMinutes } from "@/lib/dashboard/studyHours";

function StatBlock({ label, count, hint, tone, href, preview }) {
  const tones = {
    red: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    blue: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
    violet: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
    emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
  };

  const inner = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{count}</p>
      {hint ? <p className="mt-1 text-[10px] text-zinc-500">{hint}</p> : null}
      {preview?.length ? (
        <ul className="mt-2 space-y-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
          {preview.slice(0, 2).map((t) => (
            <li key={t} className="truncate">
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  const className = `flex min-h-[100px] flex-col rounded-xl border p-3 shadow-sm ${tones[tone] ?? tones.blue}`;

  if (href) {
    return (
      <Link href={href} className={`${className} transition hover:ring-1 hover:ring-zinc-300 dark:hover:ring-zinc-600`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

function previewTitles(items) {
  return (items ?? []).map((a) => a.title);
}

export function DashboardStatBlocks({ summary }) {
  const b = summary.stat_buckets ?? {};
  const studyLabel = formatStudyMinutes(summary.study_minutes_week ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatBlock
        label="Overdue"
        count={summary.overdue_count ?? 0}
        tone="red"
        href="/app/courses"
        preview={previewTitles(b.overdue)}
      />
      <StatBlock
        label="Due today"
        count={summary.due_today_count ?? 0}
        tone="amber"
        href="/app/courses"
        preview={previewTitles(b.due_today)}
      />
      <StatBlock
        label="Soon"
        count={summary.soon_due_count ?? 0}
        hint="Next 48 hours"
        tone="blue"
        href="/app/courses"
        preview={previewTitles(b.soon)}
      />
      <StatBlock
        label="Needs redo"
        count={summary.needs_redo_count ?? 0}
        hint="Low scores — fix on Courses"
        tone="violet"
        href="/app/courses"
      />
      <StatBlock
        label="Study hours"
        count={studyLabel}
        hint="Focus timer this week"
        tone="emerald"
        href="/app/study"
      />
    </div>
  );
}
