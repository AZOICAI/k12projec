"use client";

import { apiPaths } from "@k12/shared";
import { useRouter } from "next/navigation";
import { formatGradeLabel, getLowGradeThreshold } from "@/lib/assignments/grades";
import { patchAssignment } from "@/lib/assignments/patchAssignment";
import { NeedsRedoPanel } from "@/components/dashboard/NeedsRedoPanel";

export function CourseRedoSection({ course, pushUndo }) {
  const router = useRouter();
  const threshold = getLowGradeThreshold(course);
  const belowTarget =
    course.current_grade_percent != null &&
    course.target_grade_percent != null &&
    Number(course.current_grade_percent) < Number(course.target_grade_percent);

  async function markLowGrade(assignment, next) {
    const prev = Boolean(assignment.is_low_grade);
    const ok = await patchAssignment(assignment.id, { is_low_grade: next });
    if (!ok) return;
    pushUndo?.({
      label: "mark low grade",
      run: async () => {
        await patchAssignment(assignment.id, { is_low_grade: prev });
      },
    });
    router.refresh();
  }

  async function scheduleClassRedo() {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    due.setHours(17, 0, 0, 0);
    const res = await fetch(apiPaths.assignments, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: course.id,
        title: `${course.name} — redo`,
        due_at: due.toISOString(),
        is_redo: true,
      }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-4 border-t border-violet-100 pt-4 dark:border-violet-900/50">
      <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Redo / low grades</p>

      {belowTarget ? (
        <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">
          <p>
            Class grade is <strong>{course.current_grade_percent}%</strong> (goal {course.target_grade_percent}
            %).
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-violet-700 underline dark:text-violet-300"
            onClick={() => void scheduleClassRedo()}
          >
            Schedule a general redo for this class
          </button>
        </div>
      ) : null}

      {course.needs_redo?.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs text-zinc-500">Low scores (below {threshold}%)</p>
          <NeedsRedoPanel
            items={course.needs_redo}
            onRefresh={() => router.refresh()}
            pushUndo={pushUndo}
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          Sync Canvas in Settings to pull assignment scores, or mark a turned-in assignment below.
        </p>
      )}

      {course.markable_done?.length > 0 ? (
        <ul className="mt-3 space-y-2">
          <p className="text-xs font-medium text-zinc-500">Turned in — mark if low grade</p>
          {course.markable_done.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {a.title}
                {a.grade_percent != null ? ` · ${formatGradeLabel(a)}` : ""}
              </span>
              <button
                type="button"
                className="text-violet-700 underline dark:text-violet-300"
                onClick={() => void markLowGrade(a, true)}
              >
                Mark low grade
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
