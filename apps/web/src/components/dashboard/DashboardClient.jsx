"use client";

import { apiPaths } from "@k12/shared";
import { useRouter } from "next/navigation";
import { StatCard } from "./StatCard";
import { WeeklyProgress } from "./WeeklyProgress";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { WorkNowCard } from "./WorkNowCard";

export function DashboardClient({ initialSummary }) {
  const router = useRouter();
  const s = initialSummary;

  async function markDone(id) {
    await fetch(apiPaths.assignment(id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <WorkNowCard items={s.work_now} onMarkDone={markDone} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Overdue" value={s.overdue_count} accent="danger" />
        <StatCard label="Due today" value={s.due_today_count} accent="warn" />
        <StatCard label="Due soon" value={s.due_soon_count} accent="warn" />
        <StatCard
          label="Study hours"
          value={s.study_hours_this_week}
          hint="Scheduled this week"
        />
      </div>
      <WeeklyProgress
        percent={s.progress_percent}
        done={s.done_this_week_count}
        total={s.week_assignment_total}
      />
      <UpcomingDeadlines items={s.upcoming_deadlines} onMarkDone={markDone} />
    </div>
  );
}
