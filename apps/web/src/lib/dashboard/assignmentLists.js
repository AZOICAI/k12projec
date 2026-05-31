import { assignmentNeedsRedo, getLowGradeThreshold } from "@/lib/assignments/grades";
import { isArchivedAssignment } from "@/lib/assignments/stale";

export function mapAssignmentForDashboard(a) {
  return {
    id: a.id,
    title: a.title,
    due_at: a.due_at,
    status: a.status,
    course_id: a.course_id,
    is_redo: Boolean(a.is_redo),
    is_low_grade: Boolean(a.is_low_grade),
    grade_percent: a.grade_percent != null ? Number(a.grade_percent) : null,
    score: a.score,
    points_possible: a.points_possible,
    redo_of_assignment_id: a.redo_of_assignment_id ?? null,
    redo_dismissed: Boolean(a.redo_dismissed),
    courses: a.courses,
  };
}

/** Graded work below class target with no active redo scheduled yet. */
export function computeNeedsRedoAssignments(assignments, courses, now = new Date()) {
  const ts = now.getTime();
  return assignments
    .filter((a) => !isArchivedAssignment(a, ts) && assignmentNeedsRedo(a, courses, assignments))
    .sort((a, b) => {
      const pa = a.grade_percent ?? 0;
      const pb = b.grade_percent ?? 0;
      if (pa !== pb) return pa - pb;
      return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
    })
    .map((a) => {
      const course = courses.find((c) => c.id === a.course_id);
      return {
        ...mapAssignmentForDashboard(a),
        low_grade_threshold: getLowGradeThreshold(course),
      };
    });
}
