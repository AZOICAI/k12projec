"use client";

import { useRouter } from "next/navigation";
import { patchAssignment } from "@/lib/assignments/patchAssignment";
import { DashboardStatBlocks } from "./DashboardStatBlocks";
import { DashboardWeekList } from "./DashboardWeekList";
import { StartMyDay } from "./StartMyDay";

export function DashboardClient({ initialSummary, pushUndo }) {
  const router = useRouter();
  const s = initialSummary;
  const done = s.done_this_week_count ?? 0;
  const total = s.week_assignment_total ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  async function patchWithUndo(id, body, undoBody, label) {
    const ok = await patchAssignment(id, body);
    if (!ok) return;
    pushUndo?.({
      label,
      run: async () => {
        await patchAssignment(id, undoBody);
      },
    });
    router.refresh();
  }

  function setStatus(id, status, previousStatus) {
    void patchWithUndo(id, { status }, { status: previousStatus }, "status");
  }

  return (
    <div className="flex flex-col gap-6">
      <StartMyDay
        courses={s.courses}
        onMarkDone={(a) => setStatus(a.id, "done", a.status ?? "todo")}
      />

      <DashboardStatBlocks summary={s} />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">This week</span>
          <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
            {done} of {total} done
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${total ? Math.min(100, percent) : 0}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Class breakdown and redos live on <span className="font-medium">Courses</span>. Ctrl+Z to undo.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Due this week</h3>
        <DashboardWeekList items={s.week_assignments} onStatusChange={setStatus} />
      </div>
    </div>
  );
}
