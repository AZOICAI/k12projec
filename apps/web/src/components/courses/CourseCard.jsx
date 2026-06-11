"use client";

import { apiPaths } from "@k12/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { patchAssignment } from "@/lib/assignments/patchAssignment";
import { CourseGradeFields } from "./CourseGradeFields";
import { CourseAssignmentSection } from "./CourseAssignmentSection";
import { CourseRedoSection } from "./CourseRedoSection";

export function CourseCard({ course, pushUndo }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  async function markDone(assignment) {
    setMarkingId(assignment.id);
    const prev = assignment.status;
    const ok = await patchAssignment(assignment.id, { status: "done" });
    setMarkingId(null);
    if (!ok) return;
    pushUndo?.({
      label: "mark done",
      run: async () => {
        await patchAssignment(assignment.id, { status: prev });
      },
    });
    router.refresh();
  }

  async function deleteCourse() {
    const ok = window.confirm(
      `Delete "${course.name}"? All assignments in this class will be removed.`,
    );
    if (!ok) return;

    setDeleting(true);
    const res = await fetch(apiPaths.course(course.id), {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} aria-hidden />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{course.name}</h2>
          {course.current_grade_percent != null ? (
            <span
              className={`rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums ${
                course.class_below_target
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              }`}
            >
              {course.current_grade_percent}%
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-zinc-500 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
          onClick={() => void deleteCourse()}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete class"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          {course.class_below_target ? (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              Below goal
            </span>
          ) : null}
          {course.overdue_count > 0 ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
              {course.overdue_count} overdue
            </span>
          ) : null}
          {course.due_today_count > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {course.due_today_count} today
            </span>
          ) : null}
          {course.soon_due_count > 0 ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              {course.soon_due_count} soon
            </span>
          ) : null}
          {course.needs_redo_count > 0 ? (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              {course.needs_redo_count} low score
            </span>
          ) : null}
      </div>

      <CourseGradeFields course={course} onSaved={() => router.refresh()} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <CourseAssignmentSection
          title="Overdue"
          items={course.overdue}
          emptyText="None"
          onMarkDone={markDone}
          markingId={markingId}
        />
        <CourseAssignmentSection
          title="Due today"
          items={course.due_today}
          emptyText="None"
          onMarkDone={markDone}
          markingId={markingId}
        />
        <CourseAssignmentSection
          title="Soon"
          items={course.soon}
          emptyText="None in 48h"
          onMarkDone={markDone}
          markingId={markingId}
        />
      </div>

      <CourseRedoSection course={course} pushUndo={pushUndo} />
    </article>
  );
}
