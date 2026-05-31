import {
  isMissingAssignmentColumn,
  normalizeAssignmentRow,
  normalizeAssignmentRows,
} from "@/lib/assignments/assignmentFlags";

const SELECT_FULL =
  "id, title, due_at, status, course_id, is_recovery, is_low_grade, score, points_possible, grade_percent, redo_of_assignment_id, redo_dismissed, courses(name, color)";
const SELECT_FLAGS =
  "id, title, due_at, status, course_id, is_recovery, is_low_grade, courses(name, color)";
const SELECT_BASE = "id, title, due_at, status, course_id, courses(name, color)";

function withDefaults(row, extra = {}) {
  return normalizeAssignmentRow({
    ...row,
    is_recovery: row.is_recovery,
    is_low_grade: row.is_low_grade,
    score: null,
    points_possible: null,
    grade_percent: null,
    redo_of_assignment_id: null,
    redo_dismissed: false,
    ...extra,
  });
}

/** Load assignments for dashboard. */
export async function fetchUserAssignments(supabase, userId) {
  let res = await supabase
    .from("assignments")
    .select(SELECT_FULL)
    .eq("user_id", userId)
    .order("due_at", { ascending: true });

  if (res.error && isMissingAssignmentColumn(res.error)) {
    res = await supabase
      .from("assignments")
      .select(SELECT_FLAGS)
      .eq("user_id", userId)
      .order("due_at", { ascending: true });
    if (!res.error) {
      return (res.data ?? []).map((row) => withDefaults(row));
    }
    res = await supabase
      .from("assignments")
      .select(SELECT_BASE)
      .eq("user_id", userId)
      .order("due_at", { ascending: true });
    if (res.error) throw new Error(res.error.message);
    return (res.data ?? []).map((row) =>
      withDefaults(row, { is_recovery: false, is_low_grade: false }),
    );
  }

  if (res.error) throw new Error(res.error.message);
  return normalizeAssignmentRows(res.data ?? []);
}
