import { isAssignmentOverdue, isDueToday } from "@k12/shared";
import { isArchivedAssignment } from "@/lib/assignments/stale";
import { computeNeedsRedoAssignments, mapAssignmentForDashboard } from "./assignmentLists";
import { isSoonDueAssignment } from "./assignmentBuckets";

function hasRedoChild(allAssignments, assignmentId) {
  return allAssignments.some((a) => a.redo_of_assignment_id === assignmentId);
}

export function buildCourseDetailCards(courses, assignments, now = new Date()) {
  const ts = now.getTime();
  const allNeedsRedo = computeNeedsRedoAssignments(assignments, courses, now);

  return [...courses]
    .map((course) => {
      const active = assignments.filter(
        (a) =>
          a.course_id === course.id &&
          a.status !== "done" &&
          !isArchivedAssignment(a, ts),
      );

      const overdue = active
        .filter((a) => isAssignmentOverdue(a, ts))
        .map(mapAssignmentForDashboard);
      const dueToday = active
        .filter((a) => isDueToday(a.due_at, now))
        .map(mapAssignmentForDashboard);
      const soon = active
        .filter((a) => isSoonDueAssignment(a, now))
        .map(mapAssignmentForDashboard);
      const needsRedo = allNeedsRedo.filter((a) => a.course_id === course.id);
      const needsRedoIds = new Set(needsRedo.map((a) => a.id));

      const markableDone = assignments
        .filter(
          (a) =>
            a.course_id === course.id &&
            a.status === "done" &&
            !isArchivedAssignment(a, ts) &&
            !needsRedoIds.has(a.id) &&
            !a.redo_dismissed &&
            !hasRedoChild(assignments, a.id),
        )
        .slice(0, 8)
        .map(mapAssignmentForDashboard);

      const classBelowTarget =
        course.current_grade_percent != null &&
        course.target_grade_percent != null &&
        Number(course.current_grade_percent) < Number(course.target_grade_percent);

      return {
        id: course.id,
        name: course.name,
        color: course.color,
        current_grade_percent: course.current_grade_percent,
        target_grade_percent: course.target_grade_percent,
        credit_hours: course.credit_hours ?? 1,
        is_weighted: Boolean(course.is_weighted),
        overdue_count: overdue.length,
        due_today_count: dueToday.length,
        soon_due_count: soon.length,
        needs_redo_count: needsRedo.length,
        overdue,
        due_today: dueToday,
        soon,
        needs_redo: needsRedo,
        markable_done: markableDone,
        class_below_target: classBelowTarget,
        focus_score:
          overdue.length * 3 +
          dueToday.length * 2 +
          soon.length +
          needsRedo.length * 2 +
          (classBelowTarget ? 2 : 0),
      };
    })
    .sort((a, b) => b.focus_score - a.focus_score || a.name.localeCompare(b.name));
}
